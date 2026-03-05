# Jobs Autopilot Frontend — Project Memory

## Project Overview
Frontend for a LinkedIn job scraping platform. React 19 SPA communicating with a FastAPI backend (not yet built). Backend will delegate scraping to a Celery worker (Redis broker) storing jobs in MongoDB.

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
    AppliedPage.jsx           # Placeholder
    SettingsPage.jsx          # Placeholder
    LivePage.jsx              # Grid of active task cards
    LiveDetailPage.jsx        # Full-screen live frame viewer for one task
  context/
    ThemeContext.jsx          # AppThemeProvider + useThemeToggle hook
  data/
    mockData.js               # Mock jobs + formatSalary() + getSummary()
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

## Mock Data Shape (src/mockData.js)
```js
{
  id: "1",                               // string (URL-safe)
  name: "Senior Frontend Engineer",
  location: "Remote",                    // Remote | Hybrid | OnSite
  salary: { amount: 165000, type: "yearly" }, // or { amount: 85, type: "hourly" }
  company: "Stripe",
  score: 9.2,                            // float 1-10
  applied: true,
  url: "https://example.com/jobs/1",
  description: "Full job description..."
}
```
- `formatSalary(salary)` → `"$165K"` or `"$85/hr"`
- `getSummary(jobs)` → `{ total, scored, tailored, applied }`

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
- `apiSlice.js`: `createApi` with `baseUrl: "/api"`, tagTypes: Job, Applied, Settings
- Queries: `getJobs`, `getJob`, `getApplied`, `getSettings`
- Mutations: `scoreJob`, `applyJob`, `updateSettings`, `deleteJob`
- Exported hooks: `useGetJobsQuery`, `useGetJobQuery`, etc.
- Pages still use mock data — RTK Query hooks defined but not yet wired in

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

## Backend (Not Yet Built)
- FastAPI backend will serve REST API to the frontend
- Celery worker (Redis broker) handles LinkedIn scraping + AI job application
- MongoDB stores job data
- All API calls are stubs/mock data for now

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
