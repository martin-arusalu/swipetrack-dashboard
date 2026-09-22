# Repository Guidelines

## Structure

This repository is the SwipeTrack React/Vite operations dashboard. The related backend repository
is at `~/Documents/dev/swipetrack-api`; its `dashboard-stats` Edge Function supplies this app's data.
Coordinate dashboard response-contract changes across both repositories.

## Commands

- `npm run dev`: start the local Vite development server.
- `npm run build`: type-check and create the production build.
- `npm run lint`: run ESLint.

## Conventions

Keep credentials out of client source because every bundled value is public. Reporting ranges are
calculated in `src/ranges.ts`; the browser sends absolute `from`/`to` instants plus its IANA timezone
to the API. Preserve camelCase JSON fields and update `src/types.ts` whenever the API contract changes.

## Related backend

Backend database changes live in `~/Documents/dev/swipetrack-api/supabase/migrations/`, and the
dashboard endpoint lives in `~/Documents/dev/swipetrack-api/supabase/functions/dashboard-stats/`.
Run that repository's `npm run check` after backend changes.
