# LinkedIn Job Data — Research Notes

## LinkedIn Official APIs
- No public job search endpoint for most developers
- Job Posting API: only for approved ATS partners via LinkedIn Talent Solutions
- Official Python client: `linkedin-api-python-client` from LinkedIn Developers — limited scopes, no job search

## LinkedIn Voyager API (Internal)
- Base URL: `https://www.linkedin.com/voyager/api/`
- Private, undocumented REST API powering LinkedIn's web/mobile apps
- Auth: session cookies (`li_at` + `JSESSIONID` CSRF token)
- URN-based identifiers (e.g., `urn:li:fsd_jobPosting:123456`)
- Key job endpoints: `voyagerJobsDashJobCards`, `jobs/jobPostings/{id}`, `search/dash/clusters`
- Violates LinkedIn ToS; endpoints change without notice; aggressive bot detection

### Voyager Wrapper Libraries
- `tomquirk/linkedin-api` (Python) — most popular but went private at some point, status uncertain. Forks exist: JNYH/linkedin_api, nsandman/linkedin-api, alabarga/linkedin-api
- `PipesNBottles/li_scrapi` — async support, built on tomquirk's library
- PyPI `linkedin-api` package still installable, now sponsored by ScrapIn

## python-jobspy (JobSpy) — Recommended Starting Point
- GitHub: speedyapply/JobSpy | PyPI: `python-jobspy`
- Scrapes public job pages (no login required) from LinkedIn, Indeed, Glassdoor, Google, ZipRecruiter, Bayt, BDJobs
- Returns pandas DataFrame; actively maintained
- Python 3.10+ required
- LinkedIn-specific: rate limits ~10th page per IP, proxies essentially mandatory, ~1000 jobs max per search
- Key params: `linkedin_fetch_description` (full descriptions, more requests), `linkedin_company_ids` (company filter)
- Cannot combine `hours_old` with `easy_apply` on LinkedIn
- Indeed has no rate limiting — best board for volume

## Programmatic LinkedIn Login
- OAuth 2.0: official but very limited scopes
- Direct credential login: mostly broken by CAPTCHAs, 2FA, device verification
- Browser automation (Selenium/Playwright): heavier, somewhat better at passing detection
- **Manual cookie extraction is the practical approach**: log in once in browser, extract `li_at` cookie, reuse in scripts (lasts weeks/months)
- LinkedIn detects: request frequency, missing headers, datacenter IPs, headless browsers, cookie anomalies

## Alternative Job Data Sources
- Adzuna API: free tier, good coverage
- JSearch (RapidAPI): freemium aggregator
- SerpAPI / Google Jobs: paid, scrapes Google job results
- The Muse API: free, smaller curated dataset
- USAJobs API: free, US government only
- Remotive / Arbeitnow: niche remote job APIs
