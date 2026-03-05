from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import lifespan
from app.routers import jobs, live, settings, tasks

API_PREFIX = "/api"

tags_metadata = [
    {"name": "Jobs"},
    {"name": "Settings"},
    {"name": "Tasks"},
    {"name": "Live"},
]

app = FastAPI(title="Jobs Autopilot", lifespan=lifespan, openapi_tags=tags_metadata)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix=API_PREFIX)
app.include_router(settings.router, prefix=API_PREFIX)
app.include_router(tasks.router, prefix=API_PREFIX)
app.include_router(live.router, prefix=API_PREFIX)
