from app.models.job import JobPost
from app.scrappers import Scrapper


class LinkedIn(Scrapper):
    """Scrapper implementation for LinkedIn job postings."""

    async def fetch_jobs(self) -> list[JobPost]:
        """Fetch job postings from LinkedIn.

        Returns:
            List of job posting dicts.
        """
