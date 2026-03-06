from app.models.job import JobPost


class Scrapper:
    def __init__(self):
        self.url = None

    async def fetch_jobs(self) -> list[JobPost]:
        """Fetch jobs from the job posting URL and return a list of job posts.

        Raises:
            NotImplementedError: _description_
        """
        raise NotImplementedError("Subclasses must implement this method")

    @classmethod
    async def create(cls):
        """Async factory method to create an instance of the scrapper."""
        raise NotImplementedError("Subclasses must implement this method")
