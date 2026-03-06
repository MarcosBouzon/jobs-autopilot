# Jobs Autopilot Frontend — Project Memory

## Project Overview
Frontend for a LinkedIn job scraping platform. React 19 SPA communicating with a FastAPI backend at localhost:5000. Backend delegates scraping to a Celery worker (Redis broker) storing jobs in MongoDB.

## Stack
- React 19.2, Vite 7.3, ESLint 9 flat config
- MUI 7 (`@mui/material`, `@mui/icons-material`) + Emotion
- React Router 7 (imports from `react-router`, NOT `react-router-dom`)
- `@fontsource/roboto` (weights 300, 400, 500, 700)
- Package manager: **npm** (not pnpm/yarn)
- No TypeScript — JSX only

## Commands
```bash
npm run dev       # Vite dev server (HMR)
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build
```

## File Structure
```
src/
  main.jsx                    # Entry: BrowserRouter + AppThemeProvider + App
  App.jsx                     # Layout shell: Navbar + Container + Routes
  components/
    Navbar.jsx                # AppBar with nav links + theme toggle
    JobsTable.jsx             # MUI Table with icon action buttons
    SummaryCards.jsx          # 4 stat cards (Total, Scored, Tailored, Applied)
    TaskCard.jsx              # Live task card with thumbnail + status chip
  pages/
    HomePage.jsx              # Summary cards + jobs table
    JobDetailsPage.jsx        # Single job view
    AppliedPage.jsx           # Applied jobs (uses getJobs(?applied=true))
    SettingsPage.jsx          # Placeholder
    LivePage.jsx              # Grid of active task cards
    LiveDetailPage.jsx        # Full-screen live frame viewer for one task
  context/
    ThemeContext.jsx          # AppThemeProvider + useThemeToggle hook
  store/
    apiSlice.js               # RTK Query API slice (all endpoint definitions)
    store.js                  # Redux configureStore with RTK Query middleware
  hooks/
    useTaskStream.js          # WebSocket hook for live agent screenshot stream
  index.css                   # Minimal reset only
```

## Routes
- `/` — Home page (jobs table + summary cards)
- `/details/:id` — Job details page
- `/applied` — Applied jobs (placeholder)
- `/settings` — Settings (placeholder)
- `/live` — Grid of active task cards
- `/live/:taskId` — Full-screen live view for a single task

## Backend API (FastAPI at localhost:5000)
### JobPost schema
```js
{ _id, title, description, location, salary, company, job_board, score, applied }
```
- `_id`: string (MongoDB ObjectId), `title`/`description`/`location`/`job_board`: required strings
- `salary`/`company`: nullable strings, `score`: float (default 0), `applied`: bool (default false)
### Endpoints
- `GET /api/jobs/?applied=bool` — list (filter optional)
- `GET /api/jobs/{jid}/` — single job
- `DELETE /api/jobs/{jid}/` — 204
- `GET /api/settings/` — `{ eeo: {}, form: {}, config: {} }`
- `PATCH /api/settings/` — update
- `POST /api/score/{id}/` — dispatch Celery score task
- `POST /api/apply/{id}/` — dispatch Celery apply task
- `POST /api/resume/` — PDF upload (multipart, field: `file`)
- No `/api/applied/` — use `GET /api/jobs/?applied=true`
### Vite proxy
- `/api` → `http://127.0.0.1:5000`, `/ws` → `ws://127.0.0.1:5000`

## Key Conventions
- MUI 7 Grid uses `size={{ xs: 6, md: 3 }}` (not legacy `xs`/`md` props)
- MUI Button navigation: `component={RouterLink} to="/"` pattern
- `no-unused-vars` ESLint rule ignores uppercase + underscore-prefixed vars
- ESM only (`"type": "module"` in package.json)
- Absolute imports only (no `../..` relative paths beyond one level)

## Navbar Link Order
Jobs | Applied | Live | Settings | ThemeToggle (dark/light icon)

## Theme
- Light/dark mode via `AppThemeProvider` in `context/ThemeContext.jsx`
- `useThemeToggle()` hook exposes `{ toggleTheme, mode }`
- White AppBar (`color="default"`), `#f5f5f7` background, rounded corners
- Custom MUI theme: no boxShadow on AppBar, uppercase table headers

## RTK Query (src/store/)
- `apiSlice.js`: `createApi` with `baseUrl: "/api"`, tagTypes: Job, Settings
- Queries: `getJobs(applied?)`, `getJob(id)`, `getSettings`
- Mutations: `scoreJob(id)`, `applyJob(id)`, `updateSettings(body)`, `deleteJob(id)`, `uploadResume(file)`
- All pages wired to RTK Query (HomePage, JobDetailsPage, AppliedPage, JobsTable)
- `mockData.js` deleted — all data comes from the backend API

## Live View (WebSocket Screenshot Stream)
- `useTaskStream(taskId)` hook opens `ws://localhost:8000/ws/live/${taskId}`
- Messages: `{ type: "frame", data: "<base64 jpeg>" }` or `{ type: "done" }`
- Status enum: CONNECTING | STREAMING | DONE | TIMEOUT | ERROR
- `FRAME_TIMEOUT_MS = 10000` (10s without frame → TIMEOUT)
- `STATUS_CHIP` maps status → `{ label, color }` for MUI Chip
- `TaskCard` shows thumbnail + status chip overlay; navigates to `/live/:taskId`
- `LiveDetailPage` shows full-screen frame with back button
- `LivePage` uses `MOCK_TASKS` array (replace with real API when backend ready)
- Backend design documented in `~/Development/jobs-autopilot/LIVE_VIEW.md`
  (CDP screencast in Celery → Redis pub/sub → FastAPI WS relay)

## JobsTable Icon Buttons
- Details: `VisibilityOutlined`
- Score: `StarBorderOutlined` (blue)
- Apply: `SendOutlined` (green)
- Delete: `DeleteOutline` (red)

## Backend (Running)
- FastAPI backend at `localhost:5000`
- Celery worker (Redis broker) handles LinkedIn scraping + AI job application
- MongoDB stores job data

## Playwright MCP Testing
- Always test UI changes using Playwright MCP
- Global MCP config: `~/Library/Application Support/Code/User/mcp.json`
- Playwright configured with `--browser=firefox` (Chrome is blocked by company policy)
- Project-level `.mcp.json` also exists at project root as fallback
- Dev server typically runs on port 5175 (`npm run dev`)
- If Playwright still launches Chrome after config change, start a **new conversation** — the MCP server connection is cached per session

## Playwright Troubleshooting
- Chrome is blocked by company's system admin ("DevTools remote debugging is disallowed")
- Firefox works via Playwright's bundled Firefox (`mcp-firefox-*` profile in `~/Library/Caches/ms-playwright/`)
- Config change only takes effect in new conversations, not mid-session
- Firefox binary: `~/Library/Caches/ms-playwright/firefox-1509/firefox/Nightly.app/Contents/MacOS/firefox`
