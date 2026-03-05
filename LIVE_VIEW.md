# Live View — WebSocket Screenshot Streaming (Option 2)

Real-time view of what the Playwright agent is doing, streamed from the Celery
worker through FastAPI to the browser via WebSocket.

---

## Architecture

```
Celery Worker (Playwright)
  └─ CDP screencast → base64 JPEG frames
  └─ publishes frames to Redis pub/sub  →  channel: "screencast:<task_id>"

FastAPI
  └─ GET  /ws/live/{task_id}   WebSocket endpoint
  └─ subscribes to Redis channel, forwards frames to the browser

Frontend /live/{task_id} route
  └─ connects to WebSocket
  └─ renders each frame as <img src="data:image/jpeg;base64,...">
```

---

## 1. Celery Worker

### 1.1 Dependencies

```toml
# pyproject.toml
playwright = "*"
redis = "*"          # redis-py with async support: redis[asyncio]
```

### 1.2 Start CDP Screencast and publish frames to Redis

The worker launches Playwright in **non-headless** mode against a virtual display
(or headless — CDP screencast works in both). It uses the Chrome DevTools Protocol
`Page.startScreencast` command to receive a stream of compressed JPEG frames,
then publishes each one to a Redis pub/sub channel keyed by the Celery task ID.

```python
# worker/tasks/apply.py
import asyncio
import base64
import json

import redis.asyncio as aioredis
from celery import Task, shared_task
from playwright.async_api import async_playwright


REDIS_URL = "redis://localhost:6379/0"
SCREENCAST_CHANNEL = "screencast:{task_id}"


async def run_application(task_id: str, job_url: str) -> None:
    redis = await aioredis.from_url(REDIS_URL)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Access the underlying CDP session
        cdp = await context.new_cdp_session(page)

        # Receive each screencast frame and publish it to Redis
        async def on_screencast_frame(params: dict) -> None:
            frame_data = params["data"]  # already base64-encoded JPEG
            session_id = params["sessionId"]

            # Acknowledge the frame so CDP sends the next one
            await cdp.send("Page.screencastFrameAck", {"sessionId": session_id})

            # Publish to Redis pub/sub
            payload = json.dumps({"frame": frame_data})
            await redis.publish(SCREENCAST_CHANNEL.format(task_id=task_id), payload)

        cdp.on("Page.screencastFrame", on_screencast_frame)

        # Start screencast: JPEG at ~10 fps, scaled to 1280x800
        await cdp.send(
            "Page.startScreencast",
            {
                "format": "jpeg",
                "quality": 60,        # 0-100; lower = smaller frames
                "maxWidth": 1280,
                "maxHeight": 800,
                "everyNthFrame": 1,   # capture every frame
            },
        )

        # ── Your actual agent logic goes here ────────────────────────────
        await page.goto(job_url)
        # ... fill forms, click buttons, handle LinkedIn auth, etc.
        # ─────────────────────────────────────────────────────────────────

        await cdp.send("Page.stopScreencast")
        await browser.close()

    # Signal the frontend that the stream is finished
    await redis.publish(
        SCREENCAST_CHANNEL.format(task_id=task_id),
        json.dumps({"done": True}),
    )
    await redis.aclose()


@shared_task(bind=True)
def apply_for_job(self: Task, job_url: str) -> dict:
    asyncio.run(run_application(task_id=self.request.id, job_url=job_url))
    return {"status": "done"}
```

### 1.3 Notes

- `headless=True` works fine with CDP screencast — no Xvfb needed.
- `quality=60` and `everyNthFrame=1` at 1280×800 produces ~15-30 KB/frame.
  At 10 fps that is ~150-300 KB/s per active session — acceptable.
- Increase `everyNthFrame` (e.g. `3`) to reduce frame rate if bandwidth is a concern.
- The `Page.screencastFrameAck` call is required; CDP will not send the next frame
  until the previous one is acknowledged.

---

## 2. FastAPI WebSocket Endpoint

### 2.1 Dependencies

```toml
# pyproject.toml
fastapi = "*"
uvicorn = { extras = ["standard"] }
redis = { extras = ["asyncio"] }
```

### 2.2 WebSocket route

```python
# backend/routers/live.py
import json

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

REDIS_URL = "redis://localhost:6379/0"
SCREENCAST_CHANNEL = "screencast:{task_id}"


@router.websocket("/ws/live/{task_id}")
async def live_view(websocket: WebSocket, task_id: str) -> None:
    await websocket.accept()

    redis = await aioredis.from_url(REDIS_URL)
    pubsub = redis.pubsub()
    await pubsub.subscribe(SCREENCAST_CHANNEL.format(task_id=task_id))

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            data = json.loads(message["data"])

            if data.get("done"):
                # Tell the frontend the stream ended, then close
                await websocket.send_json({"done": True})
                break

            # Forward the raw base64 frame — the frontend prepends the data URI
            await websocket.send_json({"frame": data["frame"]})

    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe()
        await redis.aclose()
```

### 2.3 Register the router

```python
# backend/main.py
from fastapi import FastAPI
from backend.routers.live import router as live_router

app = FastAPI()
app.include_router(live_router)
```

### 2.4 CORS

If the frontend dev server runs on a different port, add CORS middleware:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 3. Frontend

The `/live/{task_id}` route connects to the WebSocket and renders each frame.
The full frontend implementation is out of scope here, but the core logic is:

```js
const ws = new WebSocket(`ws://localhost:8000/ws/live/${taskId}`);
const img = document.getElementById("live-frame");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.done) { ws.close(); return; }
  img.src = `data:image/jpeg;base64,${data.frame}`;
};
```

---

## 4. Redis Channel Lifecycle

| Event | Action |
|---|---|
| Worker starts | begins publishing to `screencast:<task_id>` |
| Worker finishes | publishes `{"done": true}`, channel goes idle |
| Frontend disconnects early | FastAPI unsubscribes from Redis — no orphan subscriptions |
| Worker crashes | channel goes idle; frontend should implement a timeout (e.g. 10 s no frame → show error) |

Channels are ephemeral — Redis pub/sub has no persistence. If the frontend connects
after the worker has finished, it will never receive a `done` message. To handle this,
store the final task status in Redis as a regular key (e.g. `task:<task_id>:status`)
and check it via a REST endpoint before opening the WebSocket.

---

## 5. Security Considerations

- The WebSocket endpoint has no auth in the example above. In production, validate a
  session token or JWT before calling `websocket.accept()`.
- Task IDs (Celery UUIDs) are unguessable but should still be scoped to the
  authenticated user — verify that `task_id` belongs to the requesting user.
- Do not expose the Redis port (6379) publicly. All communication goes through FastAPI.

---

## 6. Scaling

Each active WebSocket connection subscribes to one Redis channel. Redis pub/sub
handles fan-out natively, so multiple browser tabs watching the same task work
without any extra code. Multiple concurrent Celery workers each publish to their
own `screencast:<task_id>` channel independently.
