# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frontend for jobs-autopilot — a LinkedIn job scraping platform. React 19 SPA that communicates with a FastAPI backend (not yet built). The backend delegates scraping to a Celery worker (Redis broker) that stores jobs in MongoDB.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build to dist/
npm run lint      # ESLint (flat config, JS/JSX only)
npm run preview   # Preview production build locally
```

## Stack

- **React 19** (JSX, no TypeScript)
- **Vite 7** with `@vitejs/plugin-react`
- **MUI 7** (`@mui/material`, `@mui/icons-material`) + Emotion for styling
- **Roboto font** via `@fontsource/roboto` (weights: 300, 400, 500, 700)
- **ESLint 9** flat config with react-hooks and react-refresh plugins

## Architecture

Early-stage project. Currently contains only the Vite template scaffold. No routing, state management, or API layer yet.

Entry point: `src/main.jsx` → mounts `<App />` into `#root` with `StrictMode`.

## Conventions

- ESM only (`"type": "module"` in package.json)
- `no-unused-vars` rule ignores uppercase and underscore-prefixed variables
- Use npm (not pnpm/yarn) as the package manager

## MUI library
This project will rely heavily on the MUI library. Use mui-mcp or mui-mcpx when adding new React components or 
updating/modifying any code related to the React applicaiton.

## Application Tests
Always prefer testing your changes in the UI using the playwright mcp
