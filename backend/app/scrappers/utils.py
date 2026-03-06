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


def get_salary_from_description(job_description) -> str:
    """Parse the job description looking possible salary.

    Args:
        job_description (object): Description of a given job.

    Returns:
        str: String representing the job's salary if any.
    """

    pattern = re.compile(r"\$\s?\d+[\W|\s]?[\w|\d]+[\W?][\w]*[^\W]")
    matches = re.findall(pattern, job_description)
    if matches:
        return " - ".join(matches)

    return ""
