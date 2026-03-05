FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

COPY worker/pyproject.toml worker/uv.lock* ./
RUN uv sync --frozen --no-dev

COPY backend/app ./app

CMD ["uv", "run", "watchfiles", "--filter", "python", "celery -A app.celery_app worker --loglevel=info", "app"]
