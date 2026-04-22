import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

ADMIN_KEY = os.environ.get('ADMIN_KEY', 'admin123')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
}


def ok(data):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False)}


def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': msg}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Авторизация пользователей + Admin API (action=users|create_user|update_user|games|create_game|update_game)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')

    # ── ADMIN-роуты ───────────────────────────────────────────────────
    admin_actions = {'users', 'create_user', 'update_user', 'games', 'create_game', 'update_game'}
    if action in admin_actions:
        headers = event.get('headers') or {}
        key = headers.get('X-Admin-Key') or headers.get('x-admin-key') or ''
        if key != ADMIN_KEY:
            return err('Неверный ключ администратора', 401)
        return handle_admin(action, method, body)

    # ── Авторизация пользователя ──────────────────────────────────────
    email = (body.get('email') or '').strip().lower()
    name = (body.get('name') or '').strip()

    if not email:
        return err('Email обязателен')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT id, name, email, points, avatar_url FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if user:
        cur.close(); conn.close()
        return ok({'user': dict(user), 'is_new': False})

    if not name:
        conn.close()
        return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Имя обязательно для регистрации', 'need_name': True}, ensure_ascii=False)}

    cur.execute(
        "INSERT INTO users (name, email, points) VALUES (%s, %s, 0) RETURNING id, name, email, points, avatar_url",
        (name, email)
    )
    new_user = cur.fetchone()
    conn.commit(); cur.close(); conn.close()
    return ok({'user': dict(new_user), 'is_new': True})


def handle_admin(action, method, body):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if action == 'users':
            cur.execute("SELECT id, name, email, points, created_at FROM users ORDER BY points DESC")
            users = []
            for u in cur.fetchall():
                d = dict(u); d['created_at'] = d['created_at'].isoformat(); users.append(d)
            return ok({'users': users})

        if action == 'create_user':
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            points = int(body.get('points', 0))
            if not name or not email:
                return err('Имя и email обязательны')
            cur.execute(
                "INSERT INTO users (name, email, points) VALUES (%s, %s, %s) "
                "ON CONFLICT (email) DO NOTHING RETURNING id, name, email, points",
                (name, email, points)
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return err('Пользователь с таким email уже существует')
            return ok({'user': dict(row)})

        if action == 'update_user':
            uid = body.get('id')
            if not uid:
                return err('id обязателен')
            name = body.get('name', '').strip()
            points = body.get('points')
            if name:
                cur.execute("UPDATE users SET name = %s WHERE id = %s", (name, uid))
            if points is not None:
                cur.execute("UPDATE users SET points = %s WHERE id = %s", (int(points), uid))
            conn.commit()
            cur.execute("SELECT id, name, email, points FROM users WHERE id = %s", (uid,))
            row = cur.fetchone()
            return ok({'user': dict(row)})

        if action == 'games':
            cur.execute("""
                SELECT g.id, g.title, g.description, g.game_date, g.duration_minutes,
                       g.max_players, g.location, COUNT(b.id) AS booked_count
                FROM games g LEFT JOIN bookings b ON b.game_id = g.id
                GROUP BY g.id ORDER BY g.game_date ASC
            """)
            games = []
            for g in cur.fetchall():
                d = dict(g); d['game_date'] = d['game_date'].isoformat(); games.append(d)
            return ok({'games': games})

        if action == 'create_game':
            title = body.get('title', '').strip()
            game_date = body.get('game_date', '')
            if not title or not game_date:
                return err('Название и дата обязательны')
            cur.execute(
                "INSERT INTO games (title, description, game_date, duration_minutes, max_players, location) "
                "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (title, body.get('description', ''), game_date,
                 int(body.get('duration_minutes', 120)),
                 int(body.get('max_players', 6)),
                 body.get('location', 'Клуб настольных игр'))
            )
            new_id = cur.fetchone()['id']
            conn.commit()
            return ok({'id': new_id, 'message': 'Игра создана'})

        if action == 'update_game':
            gid = body.get('id')
            if not gid:
                return err('id обязателен')
            fields, vals = [], []
            for f in ['title', 'description', 'location', 'game_date']:
                if f in body:
                    fields.append(f"{f} = %s"); vals.append(body[f])
            for f in ['max_players', 'duration_minutes']:
                if f in body:
                    fields.append(f"{f} = %s"); vals.append(int(body[f]))
            if fields:
                vals.append(gid)
                cur.execute(f"UPDATE games SET {', '.join(fields)} WHERE id = %s", vals)
                conn.commit()
            return ok({'message': 'Игра обновлена'})

        return err(f'Неизвестное действие: {action}', 404)
    finally:
        cur.close(); conn.close()
