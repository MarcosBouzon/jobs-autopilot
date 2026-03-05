from app.models.job import JobPost
from app.scrappers import Scrapper


class Indeed(Scrapper):
    """Scrapper implementation for Indeed job postings."""

    async def fetch_jobs(self) -> list[JobPost]:
        """Fetch job postings from Indeed.

        Returns:
            List of job posting dicts.
        """
