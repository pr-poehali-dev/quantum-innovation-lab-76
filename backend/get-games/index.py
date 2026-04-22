import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """Возвращает список предстоящих игр с количеством занятых и свободных мест."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT
            g.id,
            g.title,
            g.description,
            g.game_date,
            g.duration_minutes,
            g.max_players,
            g.location,
            COUNT(b.id) AS booked_count,
            g.max_players - COUNT(b.id) AS free_slots
        FROM games g
        LEFT JOIN bookings b ON b.game_id = g.id
        WHERE g.game_date > NOW()
        GROUP BY g.id
        ORDER BY g.game_date ASC
    """)

    games = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for g in games:
        result.append({
            'id': g['id'],
            'title': g['title'],
            'description': g['description'],
            'game_date': g['game_date'].isoformat(),
            'duration_minutes': g['duration_minutes'],
            'max_players': g['max_players'],
            'location': g['location'],
            'booked_count': g['booked_count'],
            'free_slots': g['free_slots'],
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'games': result}, ensure_ascii=False),
    }
