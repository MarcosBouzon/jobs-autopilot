import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path

from agents import Runner
from litellm.exceptions import RateLimitError, ServiceUnavailableError
from openai import APIConnectionError

from app.agents.schema import JudgeVeredict, TayloredResume
from app.agents.utils import (
    build_agent,
    convert_to_pdf,
    handle_rate_limit_error,
    load_resume,
)
from app.config import config
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.tasks.utils import get_task_db

logger = logging.getLogger(__name__)


def _build_taylor_prompt(settings: Settings) -> str:
    """Build the system prompt for the Taylorer agent, incorporating user settings."""

    SYSTEM_PROMPT = f"""You are a senior technical recruiter rewriting a resume to get
this candidate an interview for a specific job. You have the candidate's original resume
and the job description.

Take the candidate's original resume and job description. Return a tailored resume as a
JSON object. Speak clearly about what the candidate owned, not the team work. Their
decisions, tradeoffs, and impact.

## RECRUITER SCAN (6 seconds):
1. Title -- matches what they are hiring?
2. Summary -- 4-5 sentences that summarize the candidate's experience and fit for the
role. This paragraph should be no more than five lines and should consisely highlight in
third person:
- The candidate's level of expertise
- The candidate's years of experience
- Any industry or market-specific information (for instance, 'operations director in B2B
startups covering APAC region', instead of just 'operations director')
3. First 3 bullets of most recent role -- verbs and outcomes match the job description?
4. Skills -- must-haves visible immediately?

## TAILORING RULES:
TITLE: Match the target role. Keep seniority (Senior/Lead/Staff). Drop company suffixes
(e.g. 'Software Engineer II at Google' becomes 'Senior Software Engineer') and team names.

SUMMARY: Rewrite from scratch. Lead with the 1-2 skills that matter most for THIS role.
Sound like someone who's done this job.

SKILLS: Reorder each category so the job's must-haves appear first.
Reframe EVERY bullet for this role. Same real work, different angle. Every bullet must be
reworded. Never copy verbatim.

PROJECTS: Reorder by relevance. 3-4 bullets for each project at max and 2 as minimum.
Drop irrelevant projects entirely.

BULLETS: Strong verb + what you built + quantified impact. Vary verbs (Built, Designed,
Implemented, Reduced, Automated, Deployed, Operated, Optimized). Most relevants first.
Max 4 per section.

## VOICE:
- Write like a real {settings.form.current_title}. Short, direct sentences. No fluff.
No jargon. No buzzwords. No cliches.
- GOOD: 'Automated financial reporting with Python + API integrations, reducing reporting
time by 80% and eliminating errors.'
- BAD: 'Responsible for automating financial reporting processes using Python and various
API integrations, which resulted in a significant reduction in reporting time and a
decrease in errors.'
- No em dashes. Use commas, periods or hyphens instead.

## HARD RULES:
- Do NOT invent work, companies, degrees, or certifications. Only reframe existing
resume content.
- Do NOT change real numbers.
- CAN'T be longer than two pages.
- Don't break skill names into multiple skills. For instnce, 'Mycrosoft Excel' should not
be split into 'Microsoft' and 'Excel'.

## CANDIDATE'S KNOWN DETAILS:
- Current title: {settings.form.current_title}
- Programming languages: {', '.join(settings.form.programming_languages)}
- Frameworks: {', '.join(settings.form.frameworks)}
- Tools: {', '.join(settings.form.tools)}
- Additional details provided by the candidate: {settings.form.about or 'N/A'}

ONLY use any of the candidate's known details if they are not in the original resume but
are relevant for the target job. For instance, if the candidate's original resume doesn't
mention 'Python' but the candidate knows Python and the target job requires Python, you
can add 'Python' to the skills section. But if the original resume already mentions
'Python', you should not add it again or emphasize it more just because the candidate
knows Python.
"""

    return SYSTEM_PROMPT


def build_judge_prompt(settings: Settings) -> str:
    """Build the system prompt for the Judge agent"""

    known_skills = set(
        settings.form.programming_languages
        + settings.form.frameworks
        + settings.form.tools
    )

    judge_prompt = f"""You are a meticulous resume quality judge. A tailoring engine has
rewritten a candidate's resume for a specific job. Your task is to catch LIES, not
style issues or changes

## CONTEXT -- what the tailoring engine was instructed to do (all of this is ALLOWED):
- Change the title to match the job (but keep seniority)
- Rewrite the summary from scratch for the target job
- Reorder bullets and projects to put the most relevant ones first
- Reframe bullets to use job's language
- Drop low-relevance bullets and replace with more relevant ones from the original resume
- Reorder skills to put the most relevant ones first
- Change tone and wording extensively to match the target job description and sound more
like a real person.

## WHAT IS FABRICATION (FAIL for these):
1. Adding tools, programming languages, or frameworks to TECHNICAL SKILLS that are not in
the original resume. Known skills: {', '.join(known_skills)}.
2. Inventing new metrics or numbers that were not in the original resume.
3. Inventing work that has no basis in any original bullet (completely new achievements
or projects that can't be traced back to something in the original resume).
4. Adding companies, degrees or certifications that are not in the original resume.
5. Changing real numbers (inflating 40% to 60%, 300 nodes to 500 nodes, etc.)
6. Referring to the candidate by their name or using personal pronouns like 'I' or 'my',
as the original resume is anonymized:
    - BAD: 'John is a senior software engineer with experience in Python and AWS'. This
    gives the impression that someone wrote the resume for you.
    - GOOD: 'Senior software engineer with experience in Python and AWS'.
7. A Skill that appear multiple times in the Skills section is a sign of allucination
and should be flagged as fabrication. For instance, if 'Python' appears 3 times in the
Skills section, but the original resume only mentioned 'Python' once in the Skills
section, this is a sign of fabrication.
8. Skills can't be split into multiple skills. For instance, 'Microsoft Excel' should not
be split into 'Microsoft' and 'Excel'. If the original resume had 'Microsoft Excel' as a
skill, but the taylored resume has 'Microsoft' and 'Excel' as two separate skills, this is
a sign of fabrication.

## WHAT IS NOT FABRICATION (OK for these):
1. Rewording bullets to better match the job description as long as the underlying is real
2. Combining two bullets into one, or splitting one bullet into two, as long as the
underlying work is real.
3. Describing the same work with different emphasis or from a different angle
4. Dropping bullets, projects, skills, or education that are less relevant for the target
job
5. Reordering anything
6. Changing the title or summary completely to better match the target job

## TOLERANCE RULES:
The goal is to get interviews, not to be a perfect fact-checker. Allow up to 3 minor
stretches per resume:
- Adding a closely related tool that the candidate could realistically know is a MINOR
STRETCH, not a fabrication.
- Reframing a metric with slightly different wording is a MINOR STRETCH.
- Adding any LEARNABLE skill given their existing stack is a MINOR STRETCH.
- Only FAIL if there are MAJOR lies: completely invented projects, fake companies,
fake education, wildly inflated numbers, or invented metrics or invented skills that are
not closely related to anything in the original resume.

## CANDIDATE'S KNOWN DETAILS:
- Current title: {settings.form.current_title}
- Programming languages: {', '.join(settings.form.programming_languages)}
- Frameworks: {', '.join(settings.form.frameworks)}
- Tools: {', '.join(settings.form.tools)}
- Additional details provided by the candidate: {settings.form.about or 'N/A'}

Be strict about major lies. Be lenient about minor stretches and learnable skills.
Do not fail for style, tone, or restructuring changes. Your job is to catch FABRICATION,
not to critique good tailoring that could be effective in getting the candidate
interviews.
"""

    return judge_prompt


async def validate_taylored_resume(
    job: JobPost, taylored: TayloredResume, settings: Settings
) -> tuple[bool, list[str]]:
    """Validate the taylored resume against the hard rules.

    Args:
        taylored (TayloredResume): The taylored resume to validate.
        settings (Settings): User settings to validate against.

    Returns:
        tuple[bool, list[str]]: True if the resume is valid, False otherwise, and a list
        of error messages.
    """

    is_valid = True
    errors = []

    # validate languages are not duplicated
    languages = {}
    for lang in taylored.skills.languages.split(","):
        lang = lang.strip()
        languages[lang] = languages.get(lang, 0) + 1
    for lang, count in languages.items():
        if count > 1:
            is_valid = False
            errors.append(f"Language '{lang}' appears {count} times in skills")
        matches = re.findall(r"\b" + re.escape(lang) + r"\b", taylored.skills.languages)
        if len(matches) > 1:
            is_valid = False
            msg = f"Language '{lang}' appears {len(matches)} times in skills as: "
            msg += f" {', '.join(matches)}"
            errors.append(msg)

    # validate frameworks are not duplicated
    frameworks = {}
    for fw in taylored.skills.frameworks.split(","):
        fw = fw.strip()
        frameworks[fw] = frameworks.get(fw, 0) + 1
    for fw, count in frameworks.items():
        if count > 1:
            is_valid = False
            errors.append(f"Framework '{fw}' appears {count} times in skills")
        matches = re.findall(r"\b" + re.escape(fw) + r"\b", taylored.skills.frameworks)
        if len(matches) > 1:
            is_valid = False
            msg = f"Framework '{fw}' appears {len(matches)} times in skills as: "
            msg += f" {', '.join(matches)}"
            errors.append(msg)

    # validate tools are not duplicated
    tools = {}
    for tool in taylored.skills.tools.split(","):
        tool = tool.strip()
        tools[tool] = tools.get(tool, 0) + 1
    for tool, count in tools.items():
        if count > 1:
            is_valid = False
            errors.append(f"Tool '{tool}' appears {count} times in skills")
        matches = re.findall(r"\b" + re.escape(tool) + r"\b", taylored.skills.tools)
        if len(matches) > 1:
            is_valid = False
            msg = f"Tool '{tool}' appears {len(matches)} times in skills as: "
            msg += f" {', '.join(matches)}"
            errors.append(msg)

    original_resume = load_resume()
    taylored_resume = f"TITLE: {taylored.title}\n"
    taylored_resume += f"SUMMARY: {taylored.summary}\n"
    taylored_resume += f"SKILLS: {taylored.skills.model_dump_json()}\n"
    taylored_resume += "EXPERIENCE: "
    taylored_resume += json.dumps([e.model_dump() for e in taylored.experience])
    taylored_resume += "\n"
    taylored_resume += "PROJECTS: "
    taylored_resume += json.dumps([p.model_dump() for p in taylored.projects])
    taylored_resume += "\n"
    taylored_resume += "EDUCATION: "
    taylored_resume += json.dumps([e.model_dump() for e in taylored.education])

    prompt = f"JOB TITLE: {job.title}\n"
    prompt += f"JOB DESCRIPTION: {job.description}\n\n"
    prompt += f"ORIGINAL RESUME:\n{original_resume}\n\n"
    prompt += f"TAYLORED RESUME:\n{taylored_resume}\n"

    judge_prompt = build_judge_prompt(settings)
    judge = build_agent(
        name="Judge",
        sys_prompt=judge_prompt,
        output_type=JudgeVeredict,
        settings=settings,
    )

    result = None
    for _ in range(3):
        try:
            result = await Runner.run(judge, prompt)
            result = result.final_output
            break
        except ServiceUnavailableError:
            logger.error("LLM service unavailable for judge agent")
        except RateLimitError as exc:
            handle_rate_limit_error(exc)
            break

    if result and is_valid is not False:
        is_valid = result.is_valid
    errors.extend(result.errors)

    return is_valid, errors


async def taylor_resume(job: JobPost) -> str:
    """Taylor the candidate's resume for a specific job using an LLM agent.

    Args:
        job (JobPost): Job posting for which to tailor the resume.

    Returns:
        str: Tailored resume path.
    """

    db = get_task_db()
    doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
    settings = Settings.model_validate(doc)

    sys_prompt = _build_taylor_prompt(settings)
    agent = build_agent(
        name="Taylor",
        sys_prompt=sys_prompt,
        output_type=TayloredResume,
        settings=settings,
    )
    if agent is None:
        msg = "No LLM configured. Set an API key (OpenAI/Claude/Gemini) or local LLM."
        logger.error(msg)
        return ""

    resume = load_resume()
    taylor_prompt = f"ORIGINAL RESUME:\n{resume}\n\n"
    taylor_prompt += "---\n\n"
    taylor_prompt += "TARGET JOB:\n"
    taylor_prompt += f"TITLE: {job.title}\n"
    taylor_prompt += f"COMPANY: {job.company}\n"
    taylor_prompt += f"LOCATION: {job.location}\n"
    taylor_prompt += f"DESCRIPTION: {job.description or 'N/A'}\n\n"

    taylored = None
    is_valid = False
    avoid_notes = []
    for attempt in range(3):
        if avoid_notes:
            updated_sys_prompt = sys_prompt
            updated_sys_prompt += (
                "\n\n## AVOID THESE ISSUES (from previous attempts):\n"
            )
            updated_sys_prompt += "\n".join(f"- {note}" for note in avoid_notes)
            agent.instructions = updated_sys_prompt

        try:
            result = await Runner.run(agent, taylor_prompt)
            taylored = result.final_output
        except ServiceUnavailableError:
            msg = "LLM service unavailable (attempt %d/3) for job %s"
            logger.warning(msg, attempt + 1, job.title)
            continue
        except RateLimitError as exc:
            handle_rate_limit_error(exc)
            break
        except APIConnectionError:
            logger.error("Cannot connect to LLM endpoint.")
            break

        is_valid, errors = await validate_taylored_resume(job, taylored, settings)
        if is_valid:
            break

        avoid_notes.extend(errors)

    if taylored is None:
        logger.error("All attempts failed for job %s", job.title)
        return ""

    if not is_valid:
        msg = "Taylored resume did not pass validation for job %s after 3 attempts."
        logger.warning(msg, job.title)
        return ""

    resume_dir = Path(config.resumes_dir)
    file_title = re.sub(r"[^\w\s-]", "", job.title).strip()[:50].replace(" ", "_")
    company = re.sub(r"[^\w\s-]", "", job.company or "").strip()[:50].replace(" ", "_")
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    file_title = f"{file_title}_{company}_{timestamp}.pdf"
    resume_path = resume_dir / file_title

    generated = await convert_to_pdf(taylored, resume_path)
    if generated:
        return str(resume_path)

    return ""
