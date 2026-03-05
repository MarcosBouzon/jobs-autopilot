import uvicorn

from app.config import config

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5000,
        reload=config.debug,
        workers=1,
        log_level="debug" if config.debug else "info",
    )
