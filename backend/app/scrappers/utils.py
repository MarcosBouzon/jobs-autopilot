import re

from app.models.settings import Settings


def is_match(job_description) -> bool:
    """Parse the job description looking for keywords to match against. If any of the
    keywords is present, then is a possible match.

    Args:
        job_description (str): String representing a job description.

    Returns:
        bool: True if the job is a match, False otherwise.
    """

    match = False
    keywords = Settings.objects.first().keywords.split(",")

    for keyword in keywords:
        if keyword.strip().lower() in job_description.lower():
            match = True

    return match


def get_salary_from_description(job_description: str) -> str:
    """Extract salary information from a job description.

    Prioritizes salary ranges (e.g. "$100,000 - $150,000") over single
    amounts to avoid false positives like "$17.2 billion".

    Args:
        job_description: Full text of a job description.

    Returns:
        Salary string if found, empty string otherwise.
    """

    amount = r"\$\s?\d[\d,]*(?:\.\d+)?(?:\s*[kK])?"
    range_pattern = re.compile(
        rf"{amount}\s*[-–—]\s*\$?\s?\d[\d,]*(?:\.\d+)?(?:\s*[kK])?"
    )
    matches = re.findall(range_pattern, job_description)
    if matches:
        return " - ".join(matches)

    single_pattern = re.compile(
        rf"{amount}\s*(?:per\s+(?:year|hour)|/\s*(?:yr|hr|year|hour)|annually)"
    )
    matches = re.findall(single_pattern, job_description)
    if matches:
        return " - ".join(matches)

    return ""
