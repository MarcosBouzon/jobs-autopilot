import base64
import hashlib
import json
import logging
import re
import urllib.parse
from pathlib import Path

from httpx import AsyncClient, TimeoutException
from pymongo.errors import DuplicateKeyError

from app.config import config
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.scrappers import Scrapper
from app.tasks.utils import get_task_db, publish_message

FIREBASE_API_KEY = "AIzaSyBggiJ0ZSnwXoh1JILiairK8I3_BzI1V1E"
FIREBASE_SIGN_IN_URL = (
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
    f"?key={FIREBASE_API_KEY}"
)
SEARCH_URL = "https://hiring.cafe/api/search-jobs?sv=control"
FLARESOLVERR_TIMEOUT = 60000


def _strip_html(html: str) -> str:
    """Remove HTML tags and collapse whitespace."""

    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def _format_salary(min_comp: float | None, max_comp: float | None) -> str:
    """Format yearly min/max compensation into a salary string."""

    if min_comp and max_comp:
        return f"${min_comp:,.0f} - ${max_comp:,.0f}"
    if min_comp:
        return f"${min_comp:,.0f}"
    if max_comp:
        return f"${max_comp:,.0f}"
    return ""


def _parse_flaresolverr_response(raw_html: str) -> dict:
    """Extract JSON from FlareSolverr's HTML-wrapped response."""

    match = re.search(r"<pre[^>]*>(.*)</pre>", raw_html, re.DOTALL)
    text = match.group(1) if match else raw_html

    return json.loads(text)


class HiringCafe(Scrapper):
    """Scrapper for HiringCafe job postings.

    Auth flow:
    1. Firebase REST API authenticates with email/password to get
       a Bearer token (valid for 1 hour).
    2. FlareSolverr proxies the API request through a real browser,
       solving the Cloudflare challenge automatically.
    """

    def __init__(self, settings: Settings) -> None:
        super().__init__()
        self.settings = settings
        self.logger = logging.getLogger(__name__)
        self.bearer_token: str = ""

    @classmethod
    async def create(cls) -> "HiringCafe":
        """Async factory that creates a HiringCafe scrapper instance."""
        db = get_task_db()
        doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
        settings = Settings.model_validate(doc) if doc else Settings()
        instance = cls(settings)
        await instance._get_firebase_token()

        return instance

    async def _get_firebase_token(self) -> None:
        """Sign in with Firebase REST API to get a Bearer token."""

        email = self.settings.config.hc_email
        password = self.settings.config.hc_password

        if not email or not password:
            self.logger.error("HiringCafe credentials not configured")
            return

        async with AsyncClient(timeout=15) as client:
            resp = await client.post(
                FIREBASE_SIGN_IN_URL,
                json={"email": email, "password": password, "returnSecureToken": True},
            )

        if resp.status_code != 200:
            self.logger.error("Firebase auth failed: %s", resp.text)
            return

        data = resp.json()
        self.bearer_token = data.get("idToken", "")
        self.logger.info("Obtained Firebase Bearer token")

    async def _get_request_filters(self, target_role: str, locations: list[str]) -> str:
        """Construct HiringCafe API request filters based on settings.

        Args:
            target_role (str): The candidate's target job title or role.
            locations (list[str]): List of preferred job locations.

        Returns:
            str: Base64 encoded string of filters to include in the API request.
        """

        target_role = target_role or ""
        locations = locations or ["Remote", "Hybrid", "Onsite"]

        try:
            filters_path = Path(__file__).parent / "cafe_filters.json"
            with open(filters_path, encoding="utf-8") as fr:
                filters = json.load(fr)
        except FileNotFoundError:
            self.logger.error("cafe_filters.json not found at %s", filters_path)
            return ""

        filters["searchQuery"] = target_role
        filters["workplaceTypes"] = locations

        encoded = urllib.parse.quote(json.dumps(filters, separators=(",", ":")))
        return base64.b64encode(encoded.encode()).decode()

    async def _fetch_via_flaresolverr(
        self, role: str, locations: list[str]
    ) -> list[dict]:
        """Fetch search results via FlareSolverr to bypass Cloudflare."""

        url = f"{config.flaresolverr_url}/v1"
        jobs_url = SEARCH_URL

        request_filters = await self._get_request_filters(role, locations)
        if request_filters:
            jobs_url += "&s=" + request_filters

        try:
            async with AsyncClient(timeout=90) as client:
                resp = await client.post(
                    url,
                    json={
                        "cmd": "request.get",
                        "url": jobs_url,
                        "maxTimeout": FLARESOLVERR_TIMEOUT,
                        "headers": {"Authorization": f"Bearer {self.bearer_token}"},
                    },
                )
        except TimeoutException:
            self.logger.error("FlareSolverr request timed out")
            return []
        except Exception as exc:
            self.logger.error("FlareSolverr connection failed: %s", exc)
            return []

        data = resp.json()
        if data.get("status", "").lower() != "ok":
            self.logger.error("FlareSolverr failed: %s", data.get("message", "unknown"))
            return []

        solution = data.get("solution", {})
        if solution.get("status") != 200:
            self.logger.error(
                "HiringCafe API returned %d via FlareSolverr", solution.get("status")
            )
            return []

        try:
            api_data = _parse_flaresolverr_response(solution.get("response", ""))
        except (json.JSONDecodeError, ValueError) as exc:
            self.logger.error("Failed to parse API response: %s", exc)
            return []

        results = api_data.get("results", [])
        self.logger.info("HiringCafe API returned %d results", len(results))
        return results

    def _parse_job(self, result: dict) -> dict | None:
        """Parse a single API result into a job dict."""

        processed = result.get("v5_processed_job_data", {})
        job_info = result.get("job_information", {})

        title = processed.get("core_job_title", "")
        description_html = job_info.get("description", "")
        description = _strip_html(description_html)
        location = processed.get("formatted_workplace_location", "")
        location_type = processed.get("workplace_type", "")
        company = processed.get("company_name", "")
        apply_url = result.get("apply_url", "")
        job_id = result.get("id", "")

        if not title or not description or not apply_url:
            return None

        min_comp = processed.get("yearly_min_compensation")
        max_comp = processed.get("yearly_max_compensation")
        salary = _format_salary(min_comp, max_comp)

        job_hash = None
        if all((title, location, company, salary)):
            raw = f"{title}|{location}|{company}|{salary}".lower()
            job_hash = hashlib.sha256(raw.encode()).hexdigest()

        return {
            "job_id": job_id,
            "title": title,
            "description": description,
            "location": location,
            "location_types": [location_type] if location_type else [],
            "salary": salary,
            "company": company,
            "job_board": "HiringCafe",
            "url": apply_url,
            "job_hash": job_hash,
        }

    async def fetch_jobs(self) -> list[JobPost]:
        """Fetch job postings from HiringCafe API."""
        if not self.bearer_token:
            self.logger.error("No Bearer token, cannot fetch HiringCafe jobs")
            return []

        publish_message(
            "notifications",
            {
                "title": "Automation",
                "message": "HiringCafe job search has started!",
                "success": True,
            },
        )

        all_jobs = []
        for role in self.settings.form.target_role:
            locations = []

            if self.settings.config.remote:
                locations.append("Remote")
            if self.settings.config.hybrid:
                locations.append("Hybrid")
            if self.settings.config.on_site:
                locations.append("Onsite")

            results = await self._fetch_via_flaresolverr(role, locations)
            if not results:
                continue

            db = get_task_db()

            for result in results:
                applied = result.get("job_information", {}).get("appliedFromUsers", [])
                if len(applied) > 40:
                    continue

                job_details = self._parse_job(result)
                if not job_details:
                    continue

                job_post = JobPost.model_validate(job_details)
                try:
                    await db.jobs.insert_one(job_post.model_dump(exclude={"id"}))
                except DuplicateKeyError:
                    self.logger.debug("Duplicate job skipped: %s", job_post.url)

            all_jobs.extend(results)

        publish_message(
            "reload",
            {
                "title": "New Jobs",
                "message": f"Fetched {len(all_jobs)} jobs from HiringCafe!",
                "success": True,
            },
        )

        return all_jobs
