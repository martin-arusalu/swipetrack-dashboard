# SwipeTrack dashboard

A private, static React dashboard for SwipeTrack game telemetry. It can be hosted on GitHub Pages;
all data comes from the `dashboard-stats` Supabase Edge Function.

## Local development

```sh
npm install
npm run dev
```

The dashboard endpoint is hardcoded to the SwipeTrack Supabase project in `src/App.tsx`. Never put
`DASHBOARD_SECRET`, a service-role key, or an admin JWT in the source: bundled values are public in
the compiled site.

The connection screen accepts either:

- the server-side `DASHBOARD_SECRET`; or
- a Supabase user access token whose user has `app_metadata.dashboard_admin: true`, or whose email
  appears in the server-side `DASHBOARD_ADMIN_EMAILS` list.

Credentials live in `sessionStorage` by default. “Remember on this device” opts into
`localStorage`; use it only on a trusted device.

## GitHub Pages

1. Create a GitHub repository and push this directory to its `main` branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Run the included **Deploy dashboard to GitHub Pages** workflow.

The Vite base path is relative, so project sites such as `https://name.github.io/repository/` work
without changing the build configuration.

## Metric semantics

Two families of reporting periods are available.

**Rolling windows** — 24 hours, 7 days, 30 days and 365 days back from now, plus all time. These
are computed server-side and are timezone independent.

**Calendar periods** — today, this week (Monday start), this month and this year, all anchored to
midnight in the *viewer's* timezone. The browser converts those boundaries to absolute instants and
sends them to the API as `from`/`to`, so the arrow buttons can step to yesterday, last week, the
previous month or year. "Custom" takes an inclusive start and end date in the same timezone.

Active means at least one completed race in the window. A returning player is active in the window
and has a run before it; the all-time view uses runs on at least two different UTC dates. Race time
is completed race time, not whole-app session time. All-time distance and race time include
imported progression, while the windowed views are calculated from server-recorded race results.

The activity chart buckets by calendar day in the viewer's timezone and covers the selected range
(30 days for the rolling views, capped at 400 days).
