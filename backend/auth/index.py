import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """Авторизация: вход по email (если нет — регистрация). Возвращает данные пользователя."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    body = json.loads(event.get('body') or '{}')
    email = (body.get('email') or '').strip().lower()
    name = (body.get('name') or '').strip()

    if not email:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Email обязателен'}, ensure_ascii=False),
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Ищем существующего пользователя
    cur.execute("SELECT id, name, email, points, avatar_url FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if user:
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'user': dict(user), 'is_new': False}, ensure_ascii=False),
        }

    # Регистрируем нового
    if not name:
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Имя обязательно для регистрации', 'need_name': True}, ensure_ascii=False),
        }

    cur.execute(
        "INSERT INTO users (name, email, points) VALUES (%s, %s, 0) RETURNING id, name, email, points, avatar_url",
        (name, email)
    )
    new_user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'user': dict(new_user), 'is_new': True}, ensure_ascii=False),
    }
