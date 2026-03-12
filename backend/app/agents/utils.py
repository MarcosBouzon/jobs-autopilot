import json
import logging
import os
import re
from pathlib import Path

import pymupdf
from agents import Agent, ModelSettings, OpenAIChatCompletionsModel, Runner
from openai import AsyncOpenAI
from playwright.async_api import async_playwright
from pydantic import BaseModel

from app.agents.html import RESUME_CSS
from app.agents.schema import TayloredResume
from app.config import config
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.tasks.utils import get_task_db

logger = logging.getLogger(__name__)


def load_resume() -> str:
    """Extract text from the user's PDF resume."""

    resume_path = Path(config.resumes_dir) / "user_resume.pdf"
    if not resume_path.exists():
        return ""
    doc = pymupdf.open(resume_path)
    return "\n".join(page.get_text() for page in doc)


def get_cloud_model(settings: Settings) -> str | None:
    """Return the litellm model string for the first available cloud API key."""

    if settings.config.openai_api_key:
        return "openai/gpt-4.1-nano"
    if settings.config.claude_api_key:
        return "litellm/anthropic/claude-sonnet-4-20250514"
    if settings.config.gemini_api_key:
        return "litellm/gemini/gemini-2.5-flash"
    return None


def get_cloud_env(settings: Settings) -> dict[str, str]:
    """Return env vars needed by litellm for the active cloud provider."""

    env: dict[str, str] = {}
    if settings.config.openai_api_key:
        env["OPENAI_API_KEY"] = settings.config.openai_api_key
    if settings.config.claude_api_key:
        env["ANTHROPIC_API_KEY"] = settings.config.claude_api_key
    if settings.config.gemini_api_key:
        env["GEMINI_API_KEY"] = settings.config.gemini_api_key
    return env


def handle_rate_limit_error(exc: Exception) -> None:
    """Handles LLM rate limit errors by logging them.

    Args:
        exc (Exception): The exception raised due to rate limiting.
    """

    retry_secs = None
    json_match = re.search(r"\{.*\}", str(exc), re.DOTALL)

    if json_match:
        try:
            body = json.loads(json_match.group())
            msg = body.get("error", {}).get("message", "")
            delay_match = re.search(r"retry in ([\d.]+)s", msg, re.I)
            if delay_match:
                retry_secs = float(delay_match.group(1))
        except json.JSONDecodeError:
            pass

    if retry_secs:
        logger.warning("Rate limit hit, retry in %.0fs", retry_secs)
    else:
        logger.warning("Rate limit hit, retry delay unknown")


def build_agent(
    name: str,
    sys_prompt: str,
    output_type: type[BaseModel],
    settings: Settings,
    temp: float = 0.2,
) -> Agent[None] | None:
    """Build a scorer agent using cloud or local LLM based on settings."""

    cloud_model = get_cloud_model(settings)

    agent = Agent(
        name=name,
        instructions=sys_prompt,
        model_settings=ModelSettings(temperature=temp),
    )
    if output_type:
        agent.output_type = output_type

    if cloud_model:
        for key, value in get_cloud_env(settings).items():
            os.environ[key] = value
        agent.model = cloud_model

        return agent

    if settings.config.local_llm_path and settings.config.local_llm_model:
        client = AsyncOpenAI(base_url=settings.config.local_llm_path, api_key="local")
        model = OpenAIChatCompletionsModel(
            model=settings.config.local_llm_model, openai_client=client
        )
        agent.model = model

        return agent

    return None


async def convert_to_pdf(resume: TayloredResume, output_path: Path) -> bool:
    """Convert the taylored resume text to a PDF file.

    Args:
        resume: TayloredResume object with the taylored resume content.
        output_path: Path where the PDF should be saved.

    Returns:
        bool: True if the PDF was successfully generated, False otherwise.
    """

    db = get_task_db()
    doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
    settings = Settings.model_validate(doc)

    form = settings.form
    name = f"{form.first_name} {form.last_name}".strip()

    contact_parts = []
    if form.phone:
        contact_parts.append(f"Phone: {form.phone}")
    if form.email:
        contact_parts.append(f"Email: {form.email}")
    contact_line1 = " | ".join(contact_parts)

    link_parts = []
    if form.linkedin_url:
        link_parts.append(
            f'LinkedIn: <a href="{form.linkedin_url}">{form.linkedin_url}</a>'
        )
    if form.website_url:
        link_parts.append(
            f'GitHub: <a href="{form.website_url}">{form.website_url}</a>'
        )
    contact_line2 = " | ".join(link_parts)

    contact_html = f'<div class="name">{name}</div>\n'
    contact_html += f'<div class="title">{resume.title}</div>\n'
    contact_html += f'<div class="contact">{contact_line1}'
    if contact_line2:
        contact_html += f"<br>{contact_line2}"
    contact_html += "</div>"

    summary_html = (
        '<div class="section">'
        '<div class="section-title">Profile</div>'
        f'<div class="summary">{resume.summary}</div>'
        "</div>"
    )

    all_skills = []
    for category in [
        resume.skills.languages,
        resume.skills.frameworks,
        resume.skills.devops_and_infra,
        resume.skills.tools,
    ]:
        if category:
            all_skills.extend(s.strip() for s in category.split(",") if s.strip())

    skills_html = ""
    if all_skills:
        cells = "".join(f"<span>{skill}</span>" for skill in all_skills)
        skills_html = (
            '<div class="section">'
            '<div class="section-title">Skills</div>'
            f'<div class="skills-grid">{cells}</div>'
            "</div>"
        )

    exp_html = ""
    for exp in resume.experience:
        bullets = "".join(f"<li>{b}</li>" for b in exp.bullets)
        exp_html += f'<div class="entry"><div class="entry-title">{exp.header}</div><ul>{bullets}</ul></div>\n'

    html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>{RESUME_CSS}</style>
            </head>
            <body>
                <div class="header">
                    {contact_html}
                </div>
                {summary_html}
                {skills_html}
                {exp_html}
            </body>
        </html>
    """

    generated = False

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html_content)
        await page.pdf(
            path=str(output_path),
            format="Letter",
            print_background=True,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
        )
        await browser.close()
        generated = True

    return generated
