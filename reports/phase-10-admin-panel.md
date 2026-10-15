# Phase 10 — React admin panel

- Date: 2026-10-15
- Step: 1 — project setup and folder structure

## Done

- Vite + React 19 + TypeScript scaffold in this repo
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn/ui init: Radix Nova, Neutral, Lucide
- Primitives: button, input, label, card, badge, separator, sonner
- Feature folders matching master-server modules (auth, catalog, keys, customers, payments, invoices, mail, telemetry, support, admin)
- Permission codes copied from `Permissions.cs`
- `.env.example` with `VITE_API_BASE=http://127.0.0.1:8080`

## Step 2 — Login UI

Login card matches the MasterServer split layout (navy marketing pane + sign-in form).
`POST /admin/login` stores a Bearer token in `sessionStorage` and sends the user to `/`.

Validation uses Zod as the single flow: schemas in `src/lib/schemas/`, `parseForm` / `fieldError` in `src/lib/validation.ts`. New forms should add a schema and call those helpers — not hand-written if/else.

Login errors are mapped to user-facing copy (`Incorrect username or password.`, unreachable API, etc.). The API 401 text matches. CORS `ADMIN_ORIGIN` must include the Vite origin (`localhost` and `127.0.0.1` on :5173).

## Dashboard (live data)

The dashboard calls `GET /admin/analytics/overview?days=7` (see `master-server/reports/phase-11-analytics.md`).
Placeholder KPI/chart/table data was removed. System Status is not shown.

## Not started

- Remaining admin list/detail screens
- TanStack Query list modules
