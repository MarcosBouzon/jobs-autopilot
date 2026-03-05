import json

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import config

router = APIRouter(tags=["Live"])


@router.websocket("/ws/live/{task_id}")
async def live_stream(websocket: WebSocket, task_id: str) -> None:
    """Stream Playwright screencast frames for a running Celery task.

    Subscribes to the Redis pub/sub channel keyed by task_id and forwards
    each base64-encoded JPEG frame to the connected WebSocket client.
    Closes when a done signal is received or the client disconnects.
    """

    await websocket.accept()

    client = aioredis.from_url(config.redis_url)
    pubsub = client.pubsub()
    channel = f"screencast:{task_id}"
    await pubsub.subscribe(channel)

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            data = message["data"]

            if isinstance(data, bytes):
                data = data.decode()

            parsed = json.loads(data)
            await websocket.send_json(parsed)

            if parsed.get("done"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await client.aclose()
