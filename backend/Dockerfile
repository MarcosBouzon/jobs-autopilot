FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev

COPY app/ ./app/
COPY uvicorn_config.py ./

RUN mkdir -p resumes

CMD ["uv", "run", "uvicorn", "--config", "uvicorn_config.py"]
