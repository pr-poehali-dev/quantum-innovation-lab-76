import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """Отмечает выполнение задания и начисляет очки пользователю."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') == 'GET':
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, title, description, points FROM tasks ORDER BY points DESC")
        tasks = [dict(t) for t in cur.fetchall()]
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'tasks': tasks}, ensure_ascii=False),
        }

    body = json.loads(event.get('body') or '{}')
    task_id = body.get('task_id')
    user_id = body.get('user_id')

    if not task_id or not user_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'task_id и user_id обязательны'}, ensure_ascii=False),
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT points FROM tasks WHERE id = %s", (task_id,))
    task = cur.fetchone()
    if not task:
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Задание не найдено'}, ensure_ascii=False),
        }

    cur.execute(
        "INSERT INTO task_completions (task_id, user_id) VALUES (%s, %s) ON CONFLICT (task_id, user_id) DO NOTHING RETURNING id",
        (task_id, user_id)
    )
    inserted = cur.fetchone()

    if inserted:
        cur.execute("UPDATE users SET points = points + %s WHERE id = %s", (task['points'], user_id))
        conn.commit()

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'success': True,
            'already_done': inserted is None,
            'points_added': task['points'] if inserted else 0,
        }, ensure_ascii=False),
    }
