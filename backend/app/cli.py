import click

from app.tasks.apply import apply_jobs
from app.tasks.fetch import fetch_jobs
from app.tasks.score import score_jobs
from app.tasks.taylor import taylor_resumes


@click.group()
def cli() -> None:
    """Jobs Autopilot CLI — run scheduled tasks manually."""


@cli.command()
def fetch() -> None:
    """Fetch job postings from all configured job boards."""
    fetch_jobs()


@cli.command()
def score() -> None:
    """Score unscored job postings using an LLM."""
    score_jobs()


@cli.command()
def taylor() -> None:
    """Taylor resumes for high-scoring jobs."""
    taylor_resumes()


@cli.command()
def apply() -> None:
    """Apply to high-scoring jobs."""
    apply_jobs()


if __name__ == "__main__":
    cli()
