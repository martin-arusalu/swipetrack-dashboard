export type PeriodKey = "total" | "day" | "week" | "month" | "year" | "range";

export interface PeriodStats {
  key: PeriodKey;
  startsAt: string | null;
  endsAt: string | null;
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

export interface CountryCount {
  countryCode: string;
  continentCode: string | null;
  players: number;
}

export interface CityCount {
  countryCode: string;
  city: string;
  players: number;
}

/** Players who raced in the selected range, or every player for all-time. */
export interface LocationStats {
  playersWithLocation: number;
  playersWithoutLocation: number;
  countries: CountryCount[];
  cities: CityCount[];
}

export interface DashboardData {
  generatedAt: string;
  timezone: string;
  periods: PeriodStats[];
  trend: TrendPoint[];
  /** Absent from API deployments that predate player locations. */
  locations?: LocationStats;
}

export type AuthMode = "secret" | "jwt";

export interface DashboardQuery {
  from: string | null;
  to: string | null;
  timezone: string;
}

export interface Connection {
  endpoint: string;
  credential: string;
  authMode: AuthMode;
}
