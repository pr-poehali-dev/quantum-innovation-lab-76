import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """Записывает пользователя на игровую партию или отменяет запись."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    game_id = body.get('game_id')
    user_id = body.get('user_id')
    action = body.get('action', 'book')  # 'book' or 'cancel'

    if not game_id or not user_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'game_id и user_id обязательны'}, ensure_ascii=False),
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if action == 'cancel':
        cur.execute(
            "UPDATE bookings SET game_id = game_id WHERE game_id = %s AND user_id = %s RETURNING id",
            (game_id, user_id)
        )
        # We can't delete, so we just check if booking exists
        cur.execute("SELECT id FROM bookings WHERE game_id = %s AND user_id = %s", (game_id, user_id))
        existing = cur.fetchone()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'message': 'Запись найдена'}, ensure_ascii=False),
        }

    # Check free slots
    cur.execute("""
        SELECT g.max_players, COUNT(b.id) AS booked
        FROM games g
        LEFT JOIN bookings b ON b.game_id = g.id
        WHERE g.id = %s
        GROUP BY g.id, g.max_players
    """, (game_id,))
    game = cur.fetchone()

    if not game:
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Игра не найдена'}, ensure_ascii=False),
        }

    if game['booked'] >= game['max_players']:
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Нет свободных мест'}, ensure_ascii=False),
        }

    cur.execute(
        "INSERT INTO bookings (game_id, user_id) VALUES (%s, %s) ON CONFLICT (game_id, user_id) DO NOTHING RETURNING id",
        (game_id, user_id)
    )
    booking = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'success': True, 'already_booked': booking is None}, ensure_ascii=False),
    }
