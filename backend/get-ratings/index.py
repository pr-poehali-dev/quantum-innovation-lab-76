import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """Возвращает рейтинговую таблицу участников клуба, отсортированную по очкам."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT
            u.id,
            u.name,
            u.avatar_url,
            u.points,
            COUNT(tc.id) AS tasks_done,
            RANK() OVER (ORDER BY u.points DESC) AS rank
        FROM users u
        LEFT JOIN task_completions tc ON tc.user_id = u.id
        GROUP BY u.id
        ORDER BY u.points DESC
        LIMIT 50
    """)

    users = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for u in users:
        result.append({
            'id': u['id'],
            'name': u['name'],
            'avatar_url': u['avatar_url'],
            'points': u['points'],
            'tasks_done': u['tasks_done'],
            'rank': u['rank'],
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'ratings': result}, ensure_ascii=False),
    }
