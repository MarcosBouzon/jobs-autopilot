# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies and create virtualenv
uv venv && uv sync

# Run the development server (auto-reloads when DEBUG=True)
uv run python run.py

# Lint
uv run ruff check app/

# Format
uv run ruff format app/

# Type check
uv run ty check app/

# Run all tests
uv run pytest -q

# Run a single test file
uv run pytest tests/path/to/test_file.py -q

# Run a single test by name
uv run pytest -q -k "test_name"
```

## Environment

Configuration is read from `backend/.env` via `python-dotenv`. The file is loaded at import time in `app/config.py`. Key variables:

| Variable | Default | Notes |
|----------|---------|-------|
| `DEBUG` | `false` | Enables uvicorn auto-reload and debug logging |
| `MONGO_URL` | `mongodb://localhost:27017` | |
| `REDIS_HOST` | `localhost` | |
| `REDIS_PORT` | `16379` | Custom port — avoids conflict with other local Redis |
| `REDIS_URL` | derived | Redis DB 0 — used by WebSocket pub/sub |
| `CELERY_BROKER_URL` | derived | Redis DB 1 — isolated from pub/sub |

External services (MongoDB + Redis) can be started via docker compose from the project root:
```bash
docker compose up mongodb redis -d
```

MongoDB data is persisted to `backend/mongodb/` (bind mount). Uploaded resumes go to `backend/resumes/`.

## Architecture

This is a **FastAPI** application (Python 3.13) serving a React frontend. All REST routes are mounted under `/api`. The WebSocket endpoint at `/ws/live/{task_id}` is mounted at root level.

### Request flow

```
Frontend (React/RTK Query)
  → GET/POST/PATCH/DELETE /api/*   → FastAPI routers → Motor → MongoDB
  → POST /api/score/{id}/          → Celery .delay() → Redis broker → Worker
  → POST /api/apply/{id}/          → Celery .delay() → Redis broker → Worker
  → WS  /ws/live/{task_id}         → Redis pub/sub (channel: screencast:{task_id})
```

### Key files

- `app/config.py` — singleton `config` object; all env vars read here. Import `config` directly, never re-read env vars elsewhere.
- `app/database.py` — Motor client managed via FastAPI `lifespan`. Use `get_db()` as a `Depends()` in route handlers.
- `app/celery_app.py` — Celery instance shared between routers (task dispatch) and the worker (task execution). Must be importable from both.
- `app/main.py` — App factory. Adds CORS middleware and mounts all routers.

### MongoDB conventions

- `_id` (ObjectId) is always serialized to a string `id` in JSON responses using `PyObjectId = Annotated[str, BeforeValidator(str)]` defined in `app/models/job.py`.
- Route handlers receive raw Motor dicts and call `Model.model_validate(doc)` to convert them.
- For inserts, strip `id` before passing to Motor: `model.model_dump(exclude={"id"})`.
- The `settings` collection uses a hardcoded string `_id = "singleton"` (not an ObjectId) and is always upserted — never inserted explicitly.

### Celery tasks

Tasks live in `app/tasks/`. They are stubs that will eventually publish CDP screencast frames to Redis pub/sub channel `screencast:{task_id}`. The task ID returned by `.delay()` is what the frontend uses to open the WebSocket.

- `apply_job(job_id)` — single-job task; uses `bind=True` so `self.request.id` is available for future pub/sub publishing.
- `apply_jobs()` — scheduled hourly by Celery Beat; reads `min_score` from `settings.config` and dispatches `apply_job` for each matching job.
- `score_job(job_id)` — single-job scoring stub; uses `bind=True`.
- Async helpers (e.g. `apply_jobs_async`) live in `app/tasks/utils.py`.

For tasks that need MongoDB outside of a FastAPI request (i.e. in the worker process), use `get_task_db()` from `app/tasks/utils` — it creates its own Motor client with only `motor` + `app.config` as dependencies (no FastAPI import, so it works in the worker image).

### Worker

The Celery worker lives in `../worker/` with its own `pyproject.toml`. It copies `backend/app/` directly into the image (no path dependency). Run locally with:

```bash
cd ../worker && uv venv && uv sync
uv run watchfiles --filter python "celery -A app.celery_app worker --loglevel=info" app
```
