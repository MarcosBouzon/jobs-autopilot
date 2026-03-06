import json
import locale
import logging
import re
from datetime import datetime

from httpx import AsyncClient, TimeoutException
from pymongo.errors import DuplicateKeyError

from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.scrappers import Scrapper
from app.scrappers.utils import get_salary_from_description
from app.tasks.utils import get_task_db, publish_message

JOBS_TO_RETRIEVE = 100
JOB_ON_SITE = 1
JOB_REMOTE = 2
JOB_HYBRID = 3


class LinkedIn(Scrapper):
    """Scrapper implementation for LinkedIn job postings."""

    def __init__(self, settings: Settings) -> None:
        super().__init__()
        try:
            locale.setlocale(locale.LC_ALL, "en_US.UTF-8")
        except locale.Error:
            locale.setlocale(locale.LC_ALL, "en_US.utf8")

        self.headers = {
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0",
        }
        self.settings = settings
        self.workplace = []

        if self.settings.config.on_site:
            self.workplace.append(str(JOB_ON_SITE))
        if self.settings.config.hybrid:
            self.workplace.append(str(JOB_HYBRID))
        if self.settings.config.remote:
            self.workplace.append(str(JOB_REMOTE))
        if not self.workplace:
            self.workplace.append(str(JOB_REMOTE))
        self.li_at = self.settings.config.li_at
        self.li_rm = self.settings.config.li_rm
        self.jsessionid = self.settings.config.jsession_id
        self.logger = logging.getLogger("logger")

    @classmethod
    async def create(cls) -> "LinkedIn":
        """Async factory that loads settings from the database."""
        db = get_task_db()
        doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
        settings = Settings.model_validate(doc) if doc else Settings()
        return cls(settings)

    async def get_job_ids(self):
        """Get job ids from LinkedIn voyager API"""

        url = "https://www.linkedin.com/voyager/api/voyagerJobsDashJobCards?"
        url += "decorationId=com.linkedin.voyager.dash.deco.jobs.search.JobSearchCardsCollectionLite-56&"
        url += f"count={JOBS_TO_RETRIEVE}&"
        url += "q=jobSearch&"
        url += "query=("
        url += "origin:JOBS_HOME_SEARCH_BUTTON,"
        url += "keywords:python%20developer,"
        url += "locationUnion:(geoId:103644278),"
        url += f"selectedFilters:(timePostedRange:List(r86400),distance:List(25),workplaceType:List({','.join(self.workplace)})),"
        url += "spellCorrectionEnabled:true)&"
        url += "servedEventEnabled=false&"
        url += "start=0"

        async with AsyncClient() as s:
            s.cookies["li_at"] = self.li_at
            s.cookies["li_rm"] = self.li_rm
            s.cookies["JSESSIONID"] = self.jsessionid
            s.headers.update(self.headers)
            s.headers["csrf-token"] = self.jsessionid.strip('"')

            try:
                response = await s.get(url, timeout=30)
                response_dict = response.json()
            except TimeoutException:
                self.logger.error("LinkedIn API request timed out")
                return []
            except Exception as exc:
                msg = "Unexpected response structure from LinkedIn API: %s"
                self.logger.error(msg, exc)
                return []

            ids = []
            jobs = response_dict.get("elements", [])
            for job in jobs:
                card = job.get("jobCardUnion", {})
                job_id = card.get("jobPostingCard", {}).get(
                    "preDashNormalizedJobPostingUrn"
                )
                try:
                    job_id = re.findall(r"\d+", job_id)[0]
                    ids.append(job_id)
                except IndexError:
                    self.logger.error("Failed to extract job id from URN: %s", job_id)

            return ids

    async def get_job_details(self, job_id: int = None) -> dict:
        """Get job details from LinkedIn voyager API

        Args:
        - job_id: Job id to get details for.

        Returns: A dict with all the job details.
        """

        url = f"https://www.linkedin.com/voyager/api/jobs/jobPostings/{int(job_id)}?"
        url += "decorationId=com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-65&"
        url += "topN=1"

        async with AsyncClient() as s:
            s.cookies["li_at"] = self.li_at
            s.cookies["li_rm"] = self.li_rm
            s.cookies["JSESSIONID"] = self.jsessionid
            s.headers.update(self.headers)
            s.headers["csrf-token"] = self.jsessionid.strip('"')
            response = await s.get(url, timeout=30)

            if response.status_code != 200:
                msg = "LinkedIn API is not responding code: %s, response: %s"
                self.logger.error(msg, response.status_code, response.text)
                return {}

            response_dict = response.json()

            try:
                company = (
                    response_dict.get("companyDetails", {})
                    .get(
                        "com.linkedin.voyager.deco.jobs.web.shared.WebJobPostingCompany",
                        {},
                    )
                    .get("companyResolutionResult", {})
                    .get("name")
                )
            except AttributeError:
                try:
                    company = (
                        response_dict.get("companyDetails", {})
                        .get("com.linkedin.voyager.jobs.JobPostingCompanyName", {})
                        .get("companyName")
                    )
                except AttributeError:
                    company = ""

            try:
                compensation = response_dict.get("salaryInsights", {}).get(
                    "compensationBreakdown", []
                )
                compensation = compensation[0]
                median_salary = compensation.get("medianSalary", None)
                if not median_salary:
                    min_salary = locale.currency(
                        float(compensation.get("minSalary")), grouping=True
                    )
                    max_salary = locale.currency(
                        float(compensation.get("maxSalary")), grouping=True
                    )
                pay_period = compensation.get("payPeriod")

                if pay_period == "YEARLY":
                    if median_salary:
                        median_salary = locale.currency(
                            float(median_salary), grouping=True
                        )
                        salary = f"{median_salary}K/yr"
                    else:
                        min_salary = str(min_salary).split(",", maxsplit=1)[0]
                        max_salary = str(max_salary).split(",", maxsplit=1)[0]
                        salary = f"{min_salary}K/yr - {max_salary}K/yr"
                else:
                    if median_salary:
                        salary = f"{median_salary}/h"
                    else:
                        salary = f"{min_salary}/h - {max_salary}/h"

            # no salary in job post, it might be in the job description
            except (TypeError, IndexError):
                self.logger.info("Failed to get salary info from job id: %s", job_id)
                description = response_dict.get("description", {}).get("text", "")
                salary = get_salary_from_description(description)
                salary = ""

            return {
                "job_id": job_id,
                "title": response_dict.get("title"),
                "description": response_dict.get("description").get("text"),
                "location": response_dict.get("formattedLocation"),
                "salary": salary,
                "company": company,
                "job_board": "LinkedIn",
                "url": f"https://www.linkedin.com/jobs/view/{int(job_id)}/",
                "applies": response_dict.get("applies"),
            }

    async def fetch_jobs(self) -> list[JobPost]:
        """Fetch job postings from LinkedIn.

        Returns:
            List of job posting dicts.
        """

        if not self.li_at or not self.li_rm or not self.jsessionid:
            self.logger.error("LinkedIn cookies not set, cannot fetch jobs")
            return []

        publish_message(
            "notifications",
            {
                "title": "Automation",
                "message": "Automatic jobs search has started!",
                "success": True,
            },
        )

        db = get_task_db()
        job_ids = await self.get_job_ids()

        for job_id in job_ids:
            job_details = await self.get_job_details(job_id)
            if not job_details:
                continue

            # skip saturated job postings
            if job_details.pop("applies", 0) > 50:
                continue

            job_post = JobPost.model_validate(job_details)
            try:
                await db.jobs.insert_one(job_post.model_dump(exclude={"id"}))
                self.logger.info("Saved job: %s", job_post.title)
            except DuplicateKeyError:
                self.logger.debug("Duplicate job skipped: %s", job_post.url)

        publish_message(
            "reload",
            {
                "title": "New Jobs",
                "message": "New jobs have been fetched!",
                "success": True,
            },
        )
