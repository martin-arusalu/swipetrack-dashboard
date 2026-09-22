import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { loadDashboard } from "./api";
import {
  CALENDAR_PERIODS,
  ROLLING_PERIODS,
  type Selection,
  canStep,
  previousPeriodLabel,
  previousPeriodQuery,
  selectionLabel,
  selectionPeriodKey,
  selectionQuery,
  toDateInput,
} from "./ranges";
import type { AuthMode, Connection, DashboardData, PeriodStats } from "./types";

const DASHBOARD_ENDPOINT =
  "https://dnodkkhbjalucwvmwhar.supabase.co/functions/v1/dashboard-stats";

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.round(milliseconds / 60_000);
  if (totalMinutes < 60) return `${formatNumber(totalMinutes)} min`;
  const hours = totalMinutes / 60;
  if (hours < 48) return `${formatNumber(hours, 1)} hr`;
  return `${formatNumber(hours / 24, 1)} days`;
}

function formatDistance(meters: number): string {
  if (meters < 1_000) return `${formatNumber(meters)} m`;
  return `${formatNumber(meters / 1_000, meters < 10_000 ? 1 : 0)} km`;
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

function percentageChange(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "0%" : "new";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? "+" : ""}${formatNumber(change, 1)}%`;
}

function signedValue(value: number, formatter: (value: number) => string): string {
  if (value === 0) return formatter(0);
  return `${value > 0 ? "+" : "−"}${formatter(Math.abs(value))}`;
}

function MetricCard({ label, value, detail, current, previous, deltaFormatter = formatNumber, deltaUnit, comparisonLabel, tone = "ink" }: {
  label: string;
  value: string;
  detail: string;
  current: number;
  previous?: number;
  deltaFormatter?: (value: number) => string;
  deltaUnit?: string;
  comparisonLabel: string;
  tone?: "ink" | "coral" | "lime";
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top"><span>{label}</span><i aria-hidden="true" /></div>
      <strong>{value}</strong>
      <p>{detail}</p>
      {previous !== undefined && (
        <p className={`metric-card__change ${current - previous < 0 ? "metric-card__change--down" : ""}`}>
          <b>{percentageChange(current, previous)}</b>
          <span>{signedValue(current - previous, deltaFormatter)}{deltaUnit ? ` ${deltaUnit}` : ""} {comparisonLabel}</span>
        </p>
      )}
    </article>
  );
}

function Login({ onConnect, busy, error }: {
  onConnect: (connection: Connection, remember: boolean) => void;
  busy: boolean;
  error: string | null;
}) {
  const remembered = localStorage.getItem("swipetrack-dashboard-connection");
  let parsed: Partial<Connection> = {};
  try { parsed = remembered ? JSON.parse(remembered) as Partial<Connection> : {}; } catch { /* Ignore invalid saved state. */ }
  const [authMode, setAuthMode] = useState<AuthMode>(parsed.authMode || "secret");
  const [credential, setCredential] = useState(parsed.credential || "");
  const [remember, setRemember] = useState(Boolean(parsed.credential));

  return (
    <main className="login-shell">
      <section className="login-intro">
        <div className="brand brand--large"><span className="brand__mark">S</span><b>SwipeTrack</b></div>
        <p className="eyebrow">OPERATIONS / LIVE PULSE</p>
        <h1>Every run leaves<br />a signal.</h1>
        <p className="login-intro__copy">See who is playing, how they return, and where every metre goes.</p>
        <div className="track-art" aria-hidden="true"><span /><span /><span /></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">PRIVATE DASHBOARD</p>
          <h2>Open game pulse</h2>
          <p className="muted">Your credential goes directly to your Supabase Edge Function.</p>
          <form onSubmit={(event) => {
            event.preventDefault();
            onConnect({ endpoint: DASHBOARD_ENDPOINT, credential: credential.trim(), authMode }, remember);
          }}>
            <fieldset className="mode-switch" aria-label="Authentication method">
              <button type="button" className={authMode === "secret" ? "active" : ""} onClick={() => setAuthMode("secret")}>Dashboard secret</button>
              <button type="button" className={authMode === "jwt" ? "active" : ""} onClick={() => setAuthMode("jwt")}>Admin JWT</button>
            </fieldset>
            <label>{authMode === "secret" ? "Secret" : "Access token"}
              <input type="password" required value={credential} onChange={(event) => setCredential(event.target.value)} autoComplete="off" placeholder={authMode === "secret" ? "Enter dashboard secret" : "eyJhbGciOi…"} />
            </label>
            <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember on this device</label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="connect-button" disabled={busy}>{busy ? "Connecting…" : "View dashboard"}<span>→</span></button>
          </form>
          <p className="security-note"><span>●</span> Credentials stay in this browser. Leave “remember” off on shared devices.</p>
        </div>
      </section>
    </main>
  );
}

function LoadingDashboard() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="brand brand--large"><span className="brand__mark">S</span><b>SwipeTrack</b></div>
      <div className="loading-screen__pulse" aria-hidden="true"><i /><i /><i /></div>
      <p className="eyebrow">RESTORING SESSION</p>
      <h1>Loading game pulse…</h1>
      <p>Checking your access and fetching the latest telemetry.</p>
    </main>
  );
}

function RangeControls({ selection, onChange }: {
  selection: Selection;
  onChange: (next: Selection) => void;
}) {
  const today = toDateInput(new Date());
  const custom = selection.mode === "custom"
    ? selection
    : { mode: "custom" as const, from: today, to: today };

  return (
    <div className="range-controls">
      <nav className="period-tabs" aria-label="Calendar period">
        {CALENDAR_PERIODS.map((period) => (
          <button
            key={period.unit}
            className={selection.mode === "calendar" && selection.unit === period.unit ? "active" : ""}
            onClick={() => onChange({ mode: "calendar", unit: period.unit, offset: 0 })}
          >
            {period.label}
          </button>
        ))}
        <button
          className={selection.mode === "custom" ? "active" : ""}
          onClick={() => onChange(custom)}
        >
          Custom
        </button>
      </nav>
      <nav className="period-tabs period-tabs--muted" aria-label="Rolling period">
        {ROLLING_PERIODS.map((period) => (
          <button
            key={period.key}
            className={selection.mode === "rolling" && selection.key === period.key ? "active" : ""}
            onClick={() => onChange({ mode: "rolling", key: period.key })}
          >
            {period.label}
          </button>
        ))}
      </nav>
      {selection.mode === "calendar" && (
        <div className="range-stepper">
          <button
            onClick={() => onChange({ ...selection, offset: selection.offset - 1 })}
            disabled={!canStep(selection, -1)}
            aria-label="Previous period"
          >
            ‹
          </button>
          <span>{selectionLabel(selection)}</span>
          <button
            onClick={() => onChange({ ...selection, offset: selection.offset + 1 })}
            disabled={!canStep(selection, 1)}
            aria-label="Next period"
          >
            ›
          </button>
        </div>
      )}
      {selection.mode === "custom" && (
        <div className="range-stepper range-stepper--custom">
          <input
            type="date"
            value={custom.from}
            max={custom.to}
            onChange={(event) => onChange({ ...custom, from: event.target.value })}
            aria-label="Range start"
          />
          <span>→</span>
          <input
            type="date"
            value={custom.to}
            min={custom.from}
            max={today}
            onChange={(event) => onChange({ ...custom, to: event.target.value })}
            aria-label="Range end"
          />
        </div>
      )}
    </div>
  );
}

function Dashboard({ data, comparison, selection, onSelectionChange, onRefresh, onDisconnect, refreshing }: {
  data: DashboardData;
  comparison: PeriodStats | null;
  selection: Selection;
  onSelectionChange: (next: Selection) => void;
  onRefresh: () => void;
  onDisconnect: () => void;
  refreshing: boolean;
}) {
  const periodKey = selectionPeriodKey(selection);
  const selected = data.periods.find((period) => period.key === periodKey) || data.periods[0];
  const runsByProfile = Object.entries(selected.runsByProfile)
    .map(([distance, runs]) => ({ distance: Number(distance), label: Number(distance) >= 1_000 ? `${Number(distance) / 1_000}k` : distance, runs }))
    .sort((a, b) => a.distance - b.distance);
  const trend = data.trend.map((point) => ({ ...point, label: dateLabel(point.date) }));
  const nameShare = selected.activePlayers ? selected.playersWithDisplayNames / selected.activePlayers : 0;
  const appleShare = selected.activePlayers ? selected.appleLinkedPlayers / selected.activePlayers : 0;
  const comparisonText = previousPeriodLabel(selection);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand__mark">S</span><b>SwipeTrack</b><em>Game pulse</em></div>
        <div className="topbar__actions">
          <span className="live-dot"><i /> Live data</span>
          <button className="icon-button" onClick={onRefresh} disabled={refreshing} title="Refresh">{refreshing ? "···" : "↻"}</button>
          <button className="text-button" onClick={onDisconnect}>Lock</button>
        </div>
      </header>
      <main className="dashboard">
        <section className="hero-row">
          <div><p className="eyebrow">GAME HEALTH / {data.timezone}</p><h1>Players in motion.</h1><p>Updated {new Date(data.generatedAt).toLocaleString()}</p></div>
          <RangeControls selection={selection} onChange={onSelectionChange} />
        </section>

        <section className="metrics-grid">
          <MetricCard label="Active players" value={formatNumber(selected.activePlayers)} detail="Players who completed a run" current={selected.activePlayers} previous={comparison?.activePlayers} deltaUnit="players" comparisonLabel={comparisonText} tone="lime" />
          <MetricCard label="New players" value={formatNumber(selected.newPlayers)} detail="New accounts created" current={selected.newPlayers} previous={comparison?.newPlayers} deltaUnit="players" comparisonLabel={comparisonText} />
          <MetricCard label="Runs" value={formatNumber(selected.runs)} detail={`${formatNumber(selected.averageRunsPerActivePlayer, 2)} per active player`} current={selected.runs} previous={comparison?.runs} deltaUnit="runs" comparisonLabel={comparisonText} tone="coral" />
          <MetricCard label="Returning players" value={formatNumber(selected.returningPlayers)} detail={`${formatNumber(selected.retentionRate * 100, 1)}% of active players`} current={selected.returningPlayers} previous={comparison?.returningPlayers} deltaUnit="players" comparisonLabel={comparisonText} />
          <MetricCard label="Distance covered" value={formatDistance(selected.distanceMeters)} detail={`${formatDistance(selected.averageDistancePerRunMeters)} average run`} current={selected.distanceMeters} previous={comparison?.distanceMeters} deltaFormatter={formatDistance} comparisonLabel={comparisonText} />
          <MetricCard label="Race time" value={formatDuration(selected.raceTimeMs)} detail="Recorded time running" current={selected.raceTimeMs} previous={comparison?.raceTimeMs} deltaFormatter={formatDuration} comparisonLabel={comparisonText} />
          <MetricCard label="Notifications sent" value={formatNumber(selected.notificationsSent)} detail={`${formatNumber(selected.notificationsFailed)} failed`} current={selected.notificationsSent} previous={comparison?.notificationsSent} deltaUnit="notifications" comparisonLabel={comparisonText} />
          <MetricCard label="Personal bests" value={formatNumber(selected.personalBests)} detail="New PBs recorded" current={selected.personalBests} previous={comparison?.personalBests} deltaUnit="PBs" comparisonLabel={comparisonText} />
        </section>

        <section className="chart-grid">
          <article className="panel panel--wide">
            <div className="panel__heading"><div><p className="eyebrow">{trend.length}-DAY MOVEMENT</p><h2>Activity rhythm</h2></div><div className="legend"><span className="legend__runs">Runs</span><span className="legend__players">Active players</span></div></div>
            <div className="large-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 15, right: 8, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="runsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b4a" stopOpacity={0.42}/><stop offset="100%" stopColor="#ff6b4a" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid stroke="#d7d3ca" strokeDasharray="2 7" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#77746e", fontSize: 11 }} minTickGap={28} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: "#77746e", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#171916", color: "#fff", border: 0, borderRadius: 4 }} labelStyle={{ color: "#b7ff46" }} />
                  <Area type="monotone" dataKey="runs" stroke="#ff6b4a" strokeWidth={3} fill="url(#runsFill)" />
                  <Area type="monotone" dataKey="activePlayers" stroke="#171916" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel identity-panel">
            <div className="panel__heading"><div><p className="eyebrow">PLAYER SIGNAL</p><h2>Identity & return</h2></div></div>
            <Ring value={selected.retentionRate} label="Retention" />
            <div className="share-row"><span>Named profiles</span><b>{formatNumber(selected.playersWithDisplayNames)}</b><em>{formatNumber(nameShare * 100, 0)}%</em></div>
            <div className="share-track"><i style={{ width: `${Math.min(100, nameShare * 100)}%` }} /></div>
            <div className="share-row"><span>Apple linked</span><b>{formatNumber(selected.appleLinkedPlayers)}</b><em>{formatNumber(appleShare * 100, 0)}%</em></div>
            <div className="share-track share-track--dark"><i style={{ width: `${Math.min(100, appleShare * 100)}%` }} /></div>
          </article>

          <article className="panel panel--wide">
            <div className="panel__heading"><div><p className="eyebrow">RUN PROFILE MIX</p><h2>Where players compete</h2></div><p className="panel__note">Completed runs by distance</p></div>
            <div className="profile-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runsByProfile} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#d7d3ca" strokeDasharray="2 7" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#565650", fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: "#77746e", fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "#eeebe3" }} contentStyle={{ background: "#171916", color: "#fff", border: 0, borderRadius: 4 }} formatter={(value) => [formatNumber(Number(value)), "Runs"]} />
                  <Bar dataKey="runs" fill="#b7ff46" stroke="#171916" strokeWidth={1.5} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel notes-panel">
            <p className="eyebrow">READING THE DATA</p><h2>Metric notes</h2>
            <dl><div><dt>Active</dt><dd>Completed at least one run in the rolling period.</dd></div><div><dt>Returning</dt><dd>Active now and had a run before this period. All-time uses two distinct run days.</dd></div><div><dt>Identity</dt><dd>For timed periods, named and Apple-linked counts are among active players.</dd></div><div><dt>Race time</dt><dd>Time in completed races; menus and background time are not tracked.</dd></div></dl>
          </article>
        </section>
      </main>
      <footer><span>SwipeTrack telemetry</span><span>No player-level data leaves the API.</span></footer>
    </div>
  );
}

function Ring({ value, label }: { value: number; label: string }) {
  const degrees = Math.min(360, Math.max(0, value * 360));
  return <div className="ring" style={{ background: `conic-gradient(#ff6b4a ${degrees}deg, #dedbd3 ${degrees}deg)` }}><div><strong>{formatNumber(value * 100, 1)}%</strong><span>{label}</span></div></div>;
}

function readSession(): Connection | null {
  const raw = sessionStorage.getItem("swipetrack-dashboard-session");
  if (!raw) return null;
  try { return JSON.parse(raw) as Connection; } catch { return null; }
}

export default function App() {
  const initialConnection = useMemo(readSession, []);
  const [connection, setConnection] = useState<Connection | null>(initialConnection);
  const [selection, setSelection] = useState<Selection>({ mode: "calendar", unit: "week", offset: 0 });
  const [data, setData] = useState<DashboardData | null>(null);
  const [comparison, setComparison] = useState<PeriodStats | null>(null);
  const [busy, setBusy] = useState(Boolean(initialConnection));
  const [error, setError] = useState<string | null>(null);
  const hasData = data !== null;

  const query = useMemo(() => selectionQuery(selection), [selection]);
  const queryKey = `${query.from}|${query.to}|${query.timezone}`;
  const selectionKey = JSON.stringify(selection);

  const refresh = useCallback(async (nextConnection: Connection | null = connection) => {
    if (!nextConnection) return;
    setBusy(true); setError(null); setComparison(null);
    try {
      const comparisonQuery = previousPeriodQuery(selection);
      const [nextData, comparisonData] = await Promise.all([
        loadDashboard(nextConnection, query),
        comparisonQuery ? loadDashboard(nextConnection, comparisonQuery) : Promise.resolve(null),
      ]);
      setData(nextData);
      setComparison(comparisonData?.periods.find((period) => period.key === "range") ?? null);
    }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load dashboard."); if (!hasData) setConnection(null); }
    finally { setBusy(false); }
  }, [connection, hasData, query, selection]);

  useEffect(() => { if (connection) void refresh(connection); }, [connection, queryKey, selectionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = (nextConnection: Connection, remember: boolean) => {
    sessionStorage.setItem("swipetrack-dashboard-session", JSON.stringify(nextConnection));
    if (remember) localStorage.setItem("swipetrack-dashboard-connection", JSON.stringify(nextConnection));
    else localStorage.removeItem("swipetrack-dashboard-connection");
    setConnection(nextConnection);
  };
  const disconnect = () => { sessionStorage.removeItem("swipetrack-dashboard-session"); setConnection(null); setData(null); setComparison(null); setError(null); };

  if (connection && !data) return <LoadingDashboard />;
  if (!connection || !data) return <Login onConnect={connect} busy={busy} error={error} />;
  return (
    <Dashboard
      data={data}
      comparison={comparison}
      selection={selection}
      onSelectionChange={setSelection}
      onRefresh={() => void refresh()}
      onDisconnect={disconnect}
      refreshing={busy}
    />
  );
}
