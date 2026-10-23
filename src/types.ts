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
  googleLinkedPlayers?: number;
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
  /** From the player's latest game open; null for builds that predate platform reporting. */
  platform?: Platform | null;
}

export type Platform = "ios" | "android" | "editor" | "other";

export interface PlatformCount {
  /** Null for players whose game build does not report its platform yet. */
  platform: Platform | null;
  players: number;
  /** Game version from each player's latest open, most common first. */
  versions: { version: string | null; players: number }[];
}

export interface AndroidPlayer {
  displayName: string;
  appVersion: string | null;
  lastOpenedAt: string;
}

/** Players who ran or opened the game in the selected range, or every player for all time. */
export interface PlatformStats {
  players: number;
  platforms: PlatformCount[];
  /** The 50 most recently seen Android players. */
  androidPlayers: AndroidPlayer[];
}

export interface RetentionDay {
  /** Days after sign-up: 1, 7 or 30. */
  day: number;
  /** Players in the cohort whose day N has fully passed. */
  eligiblePlayers: number;
  /** Eligible players who ran or opened the game during day N. */
  retainedPlayers: number;
  rate: number;
}

export interface RunMilestone {
  runs: number;
  /** New players with at least `runs` completed runs to date. */
  players: number;
  rate: number;
}

/**
 * Cohort and engagement metrics. The cohort is players who signed up in the selected range
 * (everyone for all time); leaderboard and notification figures are for activity in the range.
 */
export interface EngagementStats {
  retention: RetentionDay[];
  newPlayers: number;
  newPlayerRuns: number;
  runsPerNewPlayer: number;
  runMilestones: RunMilestone[];
  leaderboardViews: {
    viewers: number;
    /** Players who ran or opened the game in the range. */
    activePlayers: number;
    rate: number;
    /** First recorded leaderboard view; null until a game build that reports them is used. */
    trackingSince: string | null;
  };
  notificationReturns: {
    /** Players sent a leaderboard rank alert in the range. */
    notifiedPlayers: number;
    /** Notified players who ran or opened the game within `windowHours` of an alert. */
    returnedPlayers: number;
    rate: number;
    windowHours: number;
    /** First recorded game open; earlier returns are counted from runs only. */
    appOpensTrackingSince: string | null;
  };
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
  /** Absent from API deployments that predate engagement tracking. */
  engagement?: EngagementStats;
  /** Absent from API deployments that predate platform tracking. */
  platforms?: PlatformStats;
  /** Absent from API deployments that predate weekday and hour-of-day stats. */
  activityPatterns?: ActivityPatterns;
  /** Absent from API deployments that predate the feedback prompt. */
  feedback?: FeedbackStats;
}

export type FeedbackRating = "happy" | "neutral" | "sad";

export interface FeedbackMessage {
  /** Null if the player's profile is gone. */
  displayName: string | null;
  /** Null when the player wrote without picking a face. */
  rating: FeedbackRating | null;
  message: string;
  platform: Platform | null;
  appVersion: string | null;
  createdAt: string;
}

/** Answers to the fifth-race feedback sheet first given in the selected range (all time when none). */
export interface FeedbackStats {
  /** Players who were shown the sheet. */
  prompts: number;
  happy: number;
  neutral: number;
  sad: number;
  /** Closed without picking a face. */
  dismissed: number;
  messageCount: number;
  /** The 200 newest written messages, newest first. */
  messages: FeedbackMessage[];
}

/** Activity in one weekday or hour bucket. Active players have a run in that bucket. */
export interface ActivityBucket {
  activePlayers: number;
  runs: number;
  /** App opens, deduplicated to one per player per five minutes. */
  logins: number;
  newPlayers: number;
}

/** Activity by weekday and hour of day in `timezone` (Europe/Tallinn) for the selected range. */
export interface ActivityPatterns {
  timezone: string;
  /** ISO weekday: 1 = Monday through 7 = Sunday. */
  weekdays: (ActivityBucket & { weekday: number })[];
  hours: (ActivityBucket & { hour: number })[];
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
