# Backend Memory

## Project

Jobs Autopilot backend — FastAPI app that serves a React frontend. Part of a monorepo at `../jobs-autopilot/`. The worker (`../worker/`) is a separate Celery service (not yet implemented).

## Stack

- Python 3.13, uv, FastAPI, Motor (async MongoDB), Celery + Redis, Pydantic v2
- Linter: `ruff` | Type checker: `ty` | Tests: `pytest`
- No build system (`pyproject.toml` has no `[build-system]` — this is an app, not a package)

## Running

```bash
uv venv && uv sync          # first time setup
uv run python run.py        # start server (port 5000)
docker compose up mongodb redis -d  # from project root
```

Server auto-reloads when `DEBUG=True` in `.env` (uses uvicorn WatchFiles reloader).

## Environment (backend/.env)

```
DEBUG=True
REDIS_HOST=localhost
REDIS_PORT=16379          # 16379, NOT 6379 — avoids conflict with existing local Redis
REDIS_URL=redis://${REDIS_HOST}:${REDIS_PORT}/0       # pub/sub
CELERY_BROKER_URL=redis://${REDIS_HOST}:${REDIS_PORT}/1  # Celery broker
MONGO_URL=mongodb://localhost:27017
```

`python-dotenv` loads `.env` explicitly in `app/config.py` via `load_dotenv()` before env vars are read. The `config` singleton is a plain class (not pydantic-settings).

## API Routes

All REST routes prefixed with `/api`. WebSocket at root.

| Method | Path | File |
|--------|------|------|
| GET | `/api/jobs/` | routers/jobs.py |
| GET | `/api/jobs/{jid}/` | routers/jobs.py |
| DELETE | `/api/jobs/{jid}/` | routers/jobs.py |
| GET | `/api/applied/` | routers/jobs.py |
| GET | `/api/settings/` | routers/settings.py |
| PATCH | `/api/settings/` | routers/settings.py |
| POST | `/api/score/{id}/` | routers/tasks.py |
| POST | `/api/apply/{id}/` | routers/tasks.py |
| POST | `/api/resume/` | routers/tasks.py |
| WS | `/ws/live/{task_id}` | routers/live.py |

## MongoDB

- Database: `jobs_autopilot`
- Collections: `jobs`, `settings`
- Data persisted to `backend/mongodb/` (bind mount)
- `ObjectId` → `str` via `PyObjectId = Annotated[str, BeforeValidator(str)]` in `models/job.py`
- Route handlers: `Model.model_validate(doc)` to convert Motor dicts; `model.model_dump(exclude={"id"})` for inserts
- `settings` collection uses `_id = "singleton"` (hardcoded string, not ObjectId) — always upserted with `find_one_and_update(..., upsert=True)`

## Celery

- Broker + backend: Redis DB 1 (`CELERY_BROKER_URL`)
- Tasks: `app/tasks/score.py` (`score_job`), `app/tasks/apply.py` (`apply_job`) — currently stubs
- Dispatched from routers via `.delay(job_id=id)`, returns `task_id` to frontend
- Frontend uses `task_id` to open WebSocket at `/ws/live/{task_id}`
- Workers publish CDP screencast frames to Redis pub/sub channel `screencast:{task_id}`

## Live View (WebSocket)

- Redis pub/sub on DB 0 (`REDIS_URL`), channel `screencast:{task_id}`
- FastAPI subscribes and forwards base64 JPEG frames as JSON to the browser
- Stream ends on `{"done": true}` message or client disconnect

## Frontend Contract (../frontend/src/store/apiSlice.js)

- `scoreJob(id)` → `POST /api/score/${id}/` (no body)
- `applyJob(id)` → `POST /api/apply/${id}/` (no body)
- `updateSettings(body)` → `PATCH /api/settings/`
- `deleteJob(id)` → `DELETE /api/jobs/${id}/`
- Base URL: `/api` (proxied by Vite dev server)

## Docker Compose (project root)

- `mongodb`: port 27017, bind mount `./backend/mongodb:/data/db`
- `redis`: port `16379:6379`
- `backend`: port 5000, mounts `./backend/resumes:/app/resumes`

## Known Gotchas

- `uv sync` requires `[tool.hatch.build.targets.wheel] packages = ["app"]` if a `[build-system]` is present — but we removed the build system entirely to avoid this
- `redis[asyncio]` extra no longer exists in redis 6.x — use `redis>=6.0.0` (asyncio support is built in)
- `pydantic-settings` was removed — config uses plain `os.getenv` + `python-dotenv`
- Uvicorn `reload=True` requires the app passed as a string (`"app.main:app"`), not the object — already correct in `run.py`
- Do NOT run `uv sync` with a `[build-system]` block unless `[tool.hatch.build.targets.wheel] packages = ["app"]` is also set
