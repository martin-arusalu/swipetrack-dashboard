import type { Connection, DashboardData } from "./types";

export async function loadDashboard(connection: Connection): Promise<DashboardData> {
  const headers = new Headers({ Accept: "application/json" });
  if (connection.authMode === "secret") {
    headers.set("x-dashboard-secret", connection.credential);
  } else {
    headers.set("Authorization", `Bearer ${connection.credential}`);
  }

  const response = await fetch(connection.endpoint, { headers });
  const payload = await response.json().catch(() => null) as {
    dashboard?: DashboardData;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Dashboard request failed (${response.status}).`);
  }
  if (!payload?.dashboard?.periods || !payload.dashboard.trend) {
    throw new Error("The server returned an unexpected dashboard response.");
  }
  return payload.dashboard;
}
