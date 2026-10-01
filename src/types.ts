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

/** Counted from completed runs in the selected range (all time when none). */
export interface TopPlayer {
  displayName: string;
  distanceMeters: number;
  runs: number;
  /** Today's streak; zero once the player misses a day. */
  currentStreakDays: number;
  /** Distinct days, in the viewer's timezone, with at least one completed run. */
  daysActive: number;
  /** From the player's first game open; null when unknown. Absent from older API deployments. */
  countryCode?: string | null;
  city?: string | null;
  /** Client version from the player's most recent run, in any period. Absent from older API deployments. */
  latestVersion?: string | null;
}

export interface DashboardData {
  generatedAt: string;
  timezone: string;
  periods: PeriodStats[];
  trend: TrendPoint[];
  /** Absent from API deployments that predate player locations. */
  locations?: LocationStats;
  /** Top ten by days active, then runs. Absent from API deployments that predate it. */
  topPlayers?: TopPlayer[];
}

export type LeaderboardStat =
  | "pb_100m" | "pb_200m" | "pb_400m" | "pb_800m" | "pb_1500m" | "pb_3000m" | "pb_5000m" | "pb_10000m"
  | "best_avg_speed" | "best_top_speed" | "total_distance";

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  /** Race time in ms for pb_* boards, speed in cm/s for speed boards, metres for total_distance. */
  value: number;
  achievedAt: string;
  /** From the player's first game open; null when unknown. */
  countryCode: string | null;
  city: string | null;
}

/** One page of a game leaderboard, from Supabase entries only (no mirrored PlayFab rows). */
export interface LeaderboardPage {
  stat: LeaderboardStat;
  page: number;
  pageSize: number;
  total: number;
  entries: LeaderboardEntry[];
}

export type AuthMode = "secret" | "jwt";

export interface DashboardQuery {
  from: string | null;
  to: string | null;
  timezone: string;
  /** Start of the top-players window for rolling views, which send no `from`. */
  topFrom?: string | null;
}

export interface Connection {
  endpoint: string;
  credential: string;
  authMode: AuthMode;
}
