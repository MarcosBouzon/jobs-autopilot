import logging
import os
from pathlib import Path

from agents import Agent, OpenAIChatCompletionsModel, Runner
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import config
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.tasks.utils import get_task_db

logger = logging.getLogger(__name__)

SCORE_PROMPT = """You are a job fit evaluator. Given a candidate's resume and a job
description, score how well the candidate fits the role on a scale of 0 to 10.

CANDIDATE FACTS:
- Assume the candidate has consulting experience.

SCORING CRITERIA:
- 9-10: Exceptional fit. The candidate has direct experience in nearly all required skills
and qualifications, and exceeds expectations in several areas.
- 7-8: Strong fit. The candidate meets most of the required skills and qualifications,
minor gaps easily bridged.
- 5-6: Moderate fit. The candidate has some relevant experience and skills, but also has
notable gaps in key areas.
- 3-4: Weak fit. The candidate has limited relevant experience and significant gaps in
required skills and qualifications.
- 0-2: Poor fit. The candidate has little to no relevant experience and fails to meet most
of the required skills and qualifications.

INSTRUCTIONS:
- Extract ATS keywords from the job description that match the candidate's profile.
- Provide a 2-3 sentence reasoning explaining the score.
- Be objective and consistent in your scoring.
"""


class JobScore(BaseModel):
    """Structured output from the scoring agent."""

    score: float
    keywords: list[str]
    reasoning: str


def _get_cloud_model(settings: Settings) -> str | None:
    """Return the litellm model string for the first available cloud API key."""

    if settings.config.openai_api_key:
        return "openai/gpt-4.1-nano"
    if settings.config.claude_api_key:
        return "litellm/anthropic/claude-sonnet-4-20250514"
    if settings.config.gemini_api_key:
        return "litellm/gemini/gemini-2.5-flash"
    return None


def _get_cloud_env(settings: Settings) -> dict[str, str]:
    """Return env vars needed by litellm for the active cloud provider."""

    env: dict[str, str] = {}
    if settings.config.openai_api_key:
        env["OPENAI_API_KEY"] = settings.config.openai_api_key
    if settings.config.claude_api_key:
        env["ANTHROPIC_API_KEY"] = settings.config.claude_api_key
    if settings.config.gemini_api_key:
        env["GEMINI_API_KEY"] = settings.config.gemini_api_key
    return env


def _build_agent(settings: Settings) -> Agent[None] | None:
    """Build a scorer agent using cloud or local LLM based on settings."""

    cloud_model = _get_cloud_model(settings)

    if cloud_model:
        for key, value in _get_cloud_env(settings).items():
            os.environ[key] = value

        return Agent(
            name="Scorer",
            instructions=SCORE_PROMPT,
            output_type=JobScore,
            model=cloud_model,
        )

    if settings.config.local_llm_path and settings.config.local_llm_model:
        client = AsyncOpenAI(base_url=settings.config.local_llm_path, api_key="local")
        model = OpenAIChatCompletionsModel(
            model=settings.config.local_llm_model, openai_client=client
        )
        return Agent(
            name="Scorer", instructions=SCORE_PROMPT, output_type=JobScore, model=model
        )

    return None


def _load_resume() -> str:
    """Extract text from the user's PDF resume."""
    import pymupdf

    resume_path = Path(config.resumes_dir) / "user_resume.pdf"
    if not resume_path.exists():
        return ""
    doc = pymupdf.open(resume_path)
    return "\n".join(page.get_text() for page in doc)


async def score_job(job: JobPost) -> JobScore | None:
    """Score a job posting against the candidate's resume.

    Args:
        job: The job posting to score.

    Returns:
        JobScore if successful, None if no LLM is configured.
    """
    db = get_task_db()
    doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
    settings = Settings.model_validate(doc) if doc else Settings()

    agent = _build_agent(settings)
    if agent is None:
        logger.error(
            "No LLM configured. Set an API key (OpenAI/Claude/Gemini) or local LLM path."
        )
        return None

    resume = _load_resume()
    prompt = f"## Resume\n\n{resume}\n\n## Job Description\n\n{job.description}"

    result = await Runner.run(agent, prompt)
    return result.final_output
