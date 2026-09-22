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

Day, week, month, and year are rolling UTC windows of 24, 7, 30, and 365 days. Active means at
least one completed race. A returning player is active in the current window and has a run before
the window; the all-time view uses runs on at least two different UTC dates. Race time is completed
race time, not whole-app session time. All-time distance and race time include imported progression,
while the timed windows are calculated from server-recorded race results.
