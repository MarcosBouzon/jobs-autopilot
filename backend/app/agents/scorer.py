import logging
import os
from pathlib import Path

from agents import Agent, OpenAIChatCompletionsModel, Runner
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.agents.utils import build_agent, load_resume
from app.config import config
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.tasks.utils import get_task_db

logger = logging.getLogger(__name__)


def get_scorer_prompt(settings: Settings) -> str:
    known_skils = set(
        settings.form.programming_languages
        + settings.form.frameworks
        + settings.form.tools
    )

    scorer_prompt = f"""You are a job fit evaluator. Given a candidate's resume, known skills,
aditional details provided by the client, and a job description, score how well the
candidate fits the role on a scale of 0 to 10.

CANDIDATE KNOWN SKILLS:
- {', '.join(known_skils)}

CANDIDATE ADDITIONAL DETAILS:
- {settings.form.about}

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

    return scorer_prompt


class JobScore(BaseModel):
    """Structured output from the scoring agent."""

    score: float
    keywords: list[str]
    reasoning: str


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
    sys_prompt = get_scorer_prompt(settings)

    agent = build_agent(
        name="Scorer", sys_prompt=sys_prompt, output_type=JobScore, settings=settings
    )
    if agent is None:
        msg = "No LLM configured. Set an API key (OpenAI/Claude/Gemini) or local LLM."
        logger.error(msg)
        return None

    known_skills = set(
        settings.form.programming_languages
        + settings.form.frameworks
        + settings.form.tools
    )

    resume = load_resume()
    prompt = f"## Resume\n\n{resume}\n\n"
    prompt += f"## Candidate's Known Skills\n\n{known_skills}\n\n"
    prompt += f"## Additional Details\n\n{settings.form.about}\n\n"
    prompt += f"## Job Description\n\n{job.description}"

    result = await Runner.run(agent, prompt)
    return result.final_output
