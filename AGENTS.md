# Repository Guidelines

## Structure

This repository is the SwipeTrack operations dashboard: a static React 19 + Vite + TypeScript app
with Recharts. `.github/workflows/deploy-pages.yml` deploys it to GitHub Pages on every push to
`main`. See README.md for metric semantics (active and returning players, rolling versus calendar
periods, comparisons).

- `src/App.tsx`: the whole UI: connection screen, period picker, metric cards, and charts. The
  endpoint URL is hardcoded here.
- `src/api.ts`: `loadDashboard()` sends `x-dashboard-secret` or `Authorization: Bearer` with
  `tz`, `from`, and `to`.
- `src/ranges.ts`: calendar and rolling range math in the viewer's timezone.
- `src/types.ts`: response contract. Keep it in sync with `dashboard-stats`.
- `dist/` is a build output and is gitignored.

## SwipeTrack Workspace

| Repo | Path | Relationship |
|------|------|--------------|
| swipetrack-api | `~/Documents/dev/swipetrack-api` | Serves `dashboard-stats`, the only data source. SQL is in `supabase/migrations/*dashboard_stats*.sql`. |
| runner | `~/Documents/dev/unity/runner` | Unity game that produces the race data. |
| swipetrack-web | `~/Documents/dev/swipetrack-web` | Public marketing site. Unrelated to the dashboard. |

Coordinate dashboard response-contract changes across this repo and swipetrack-api.

## Commands

- `npm run dev`: start the local Vite development server.
- `npm run build`: type-check and create the production build.
- `npm run lint`: run ESLint.

Run `npm run build` and `npm run lint` before finishing. No test suite exists.

## Conventions

Keep credentials out of client source because every bundled value is public. Never add secrets to
source or `VITE_*` variables. Credentials are entered at runtime and kept in `sessionStorage`, or in
`localStorage` only when the user opts in. Reporting ranges are calculated in `src/ranges.ts`; the
browser sends absolute `from`/`to` instants plus its IANA timezone to the API. Preserve camelCase
JSON fields and update `src/types.ts` whenever the API contract changes.

## Related Backend

Backend database changes live in `~/Documents/dev/swipetrack-api/supabase/migrations/`, and the
dashboard endpoint lives in `~/Documents/dev/swipetrack-api/supabase/functions/dashboard-stats/`.
Run that repository's `npm run check` after backend changes.
