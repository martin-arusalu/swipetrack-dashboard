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

The top 10 active players table ranks players by distance run, then runs. Days active counts
distinct calendar days in the viewer's timezone with at least one completed run. Days, runs and
distance cover the selected period and count server-recorded race results only, so imported PlayFab
history is excluded. Streak is the player's current daily streak, shown as zero once they miss a day. Country and city
come from the IP of the player's first game open, like the origins panel. Version is the client version of
the player's most recent run, whatever the selected period.

The leaderboards panel shows every game leaderboard (each distance's best time, best average and top
speed, and total distance), 100 rows per page. Boards are all time and ignore the selected period.
They read Supabase leaderboard entries only, so players still on legacy PlayFab records are not
listed and the game may show those players where the dashboard does not.

Cohort retention and the new-player funnel follow players who signed up in the selected period
(everyone for all time). D1, D7 and D30 are the share who completed a run or opened the game during
the 24 hours that start 1, 7 or 30 days after sign-up, counted only among players whose day has
already ended. Game opens are recorded from October 2026, so earlier retention counts runs only.
Runs per new player and the 1 / 5 / 10 / 25 run shares use each new player's runs to date.

The leaderboard panel shows the share of players active in the period (ran or opened the game) who
opened the game's Rankings tab, collected from the first game build that reports it, and the share
of players sent a leaderboard rank alert in the period who ran or opened the game within 24 hours
of an alert.

The weekday and hour-of-day charts bucket the selected period (the rolling window for rolling views)
in Estonian time (Europe/Tallinn), whatever the viewer's timezone. Active players are distinct
players with a run in that bucket, logins are game opens (at most one per player per five minutes,
recorded from October 2026), and new players are sign-ups.

Metric cards compare the selected period with its immediately preceding equivalent and show both
absolute and percentage change. All time has no comparison, and growth from a zero baseline is
shown as “new” because a percentage change is undefined.
