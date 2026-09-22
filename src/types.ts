export type PeriodKey = "total" | "day" | "week" | "month" | "year";

export interface PeriodStats {
  key: PeriodKey;
  startsAt: string | null;
  activePlayers: number;
  newPlayers: number;
  runs: number;
  runsByProfile: Record<string, number>;
  notificationsSent: number;
  notificationsFailed: number;
  returningPlayers: number;
  retentionRate: number;
  playersWithDisplayNames: number;
  appleLinkedPlayers: number;
  distanceMeters: number;
  raceTimeMs: number;
  personalBests: number;
  averageRunsPerActivePlayer: number;
  averageDistancePerRunMeters: number;
}

export interface TrendPoint {
  date: string;
  runs: number;
  activePlayers: number;
  newPlayers: number;
  distanceMeters: number;
}

export interface DashboardData {
  generatedAt: string;
  timezone: string;
  periods: PeriodStats[];
  trend: TrendPoint[];
}

export type AuthMode = "secret" | "jwt";

export interface Connection {
  endpoint: string;
  credential: string;
  authMode: AuthMode;
}
