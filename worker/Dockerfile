FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

COPY worker/pyproject.toml worker/uv.lock* ./
RUN uv sync --frozen --no-dev
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
RUN uv run playwright install --with-deps chromium

RUN groupadd --gid 1000 worker && \
    useradd --uid 1000 --gid worker --create-home --shell /bin/bash worker && \
    mkdir -p /home/worker/Desktop/resumes && \
    chown -R worker:worker /app /home/worker/Desktop

COPY backend/app ./app

USER worker

CMD ["uv", "run", "watchfiles", "--filter", "python", "celery -A app.celery_app worker --concurrency=4 --loglevel=info", "app"]
