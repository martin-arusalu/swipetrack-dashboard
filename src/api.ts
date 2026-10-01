import type { Connection, DashboardData, DashboardQuery, LeaderboardPage, LeaderboardStat } from "./types";

function authHeaders(connection: Connection): Headers {
  const headers = new Headers({ Accept: "application/json" });
  if (connection.authMode === "secret") {
    headers.set("x-dashboard-secret", connection.credential);
  } else {
    headers.set("Authorization", `Bearer ${connection.credential}`);
  }
  return headers;
}

export async function loadDashboard(
  connection: Connection,
  query: DashboardQuery,
): Promise<DashboardData> {
  const headers = authHeaders(connection);

  const url = new URL(connection.endpoint);
  url.searchParams.set("tz", query.timezone);
  if (query.from) url.searchParams.set("from", query.from);
  if (query.to) url.searchParams.set("to", query.to);
  if (query.topFrom) url.searchParams.set("topFrom", query.topFrom);

  const response = await fetch(url, { headers });
  const payload = await response.json().catch(() => null) as {
    dashboard?: DashboardData;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Dashboard request failed (${response.status}).`,
    );
  }
  if (!payload?.dashboard?.periods || !payload.dashboard.trend) {
    throw new Error("The server returned an unexpected dashboard response.");
  }
  return payload.dashboard;
}

export async function loadLeaderboard(
  connection: Connection,
  stat: LeaderboardStat,
  page: number,
): Promise<LeaderboardPage> {
  const url = new URL(connection.endpoint);
  url.searchParams.set("leaderboard", stat);
  url.searchParams.set("page", String(page));

  const response = await fetch(url, { headers: authHeaders(connection) });
  const payload = await response.json().catch(() => null) as {
    leaderboard?: LeaderboardPage;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Leaderboard request failed (${response.status}).`,
    );
  }
  if (!payload?.leaderboard?.entries) {
    throw new Error("This API deployment does not serve leaderboards yet.");
  }
  return payload.leaderboard;
}
