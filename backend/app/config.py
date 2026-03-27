import logging
import os

from dotenv import load_dotenv

load_dotenv()

# Supress verbose logging from dependencies as they add too much noise to the logs
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
)
for _name in ("LiteLLM", "litellm", "openai", "openai.agents", "httpx", "httpcore"):
    logging.getLogger(_name).setLevel(logging.ERROR)


class Config:
    """Application configuration loaded from environment variables."""

    mongo_url: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    mongo_db: str = os.getenv("MONGO_DB", "jobs_autopilot")
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "16379"))
    redis_url: str = os.getenv("REDIS_URL", f"redis://{redis_host}:{redis_port}/0")
    celery_broker_url: str = os.getenv("CELERY_BROKER_URL", f"redis://{redis_host}:{redis_port}/1")
    flaresolverr_url: str = os.getenv("FLARESOLVERR_URL", "http://localhost:8191")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"


config = Config()
