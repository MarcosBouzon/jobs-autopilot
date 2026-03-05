from app.celery_app import celery

if __name__ == "__main__":
    celery.worker_main(
        argv=[
            "worker",
            "--loglevel=info",
            "--concurrency=2",
        ]
    )
