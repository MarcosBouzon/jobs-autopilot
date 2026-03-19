from celery import Celery
from celery.schedules import crontab

from app.config import config

celery = Celery(
    "jobs_autopilot",
    broker=config.celery_broker_url,
    backend=config.celery_broker_url,
    include=[
        "app.tasks.fetch",
        "app.tasks.score",
        "app.tasks.apply",
        "app.tasks.taylor",
        "app.tasks.cleanup",
    ],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    beat_schedule={
        "fetch-jobs": {
            "task": "app.tasks.fetch.fetch_jobs",
            "schedule": crontab(minute="*/20"),  # every 20 minutes
        },
        "score-jobs": {
            "task": "app.tasks.score.score_jobs",
            "schedule": crontab(minute="*/5"),  # every 5 minutes
        },
        "taylor-resumes": {
            "task": "app.tasks.taylor.taylor_resumes",
            "schedule": crontab(minute="*/10"),  # every 10 minutes
        },
        "apply-jobs": {
            "task": "app.tasks.apply.apply_jobs",
            "schedule": crontab(minute="*/10"),  # every 10 minutes
        },
        "cleanup-old-jobs": {
            "task": "app.tasks.cleanup.cleanup_old_jobs",
            "schedule": crontab(minute=0),  # every hour
        },
    },
)
