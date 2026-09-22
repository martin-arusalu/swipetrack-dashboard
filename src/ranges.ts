import type { DashboardQuery, PeriodKey } from "./types";

export type CalendarUnit = "day" | "week" | "month" | "year";

export type Selection =
  | { mode: "rolling"; key: PeriodKey }
  | { mode: "calendar"; unit: CalendarUnit; offset: number }
  | { mode: "custom"; from: string; to: string };

export const ROLLING_PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "total", label: "All time" },
  { key: "day", label: "24 hours" },
  { key: "week", label: "7 days" },
  { key: "month", label: "30 days" },
  { key: "year", label: "365 days" },
];

export const CALENDAR_PERIODS: Array<{ unit: CalendarUnit; label: string }> = [
  { unit: "day", label: "Today" },
  { unit: "week", label: "This week" },
  { unit: "month", label: "This month" },
  { unit: "year", label: "This year" },
];

export const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ||
  "UTC";

/** Start of the calendar unit containing `at`, shifted by `offset` units, in local time. */
export function calendarStart(
  unit: CalendarUnit,
  offset: number,
  at = new Date(),
): Date {
  switch (unit) {
    case "day":
      return new Date(at.getFullYear(), at.getMonth(), at.getDate() + offset);
    case "week": {
      const mondayIndex = (at.getDay() + 6) % 7;
      return new Date(
        at.getFullYear(),
        at.getMonth(),
        at.getDate() - mondayIndex + offset * 7,
      );
    }
    case "month":
      return new Date(at.getFullYear(), at.getMonth() + offset, 1);
    case "year":
      return new Date(at.getFullYear() + offset, 0, 1);
  }
}

function calendarEnd(
  unit: CalendarUnit,
  offset: number,
  at = new Date(),
): Date {
  return calendarStart(unit, offset + 1, at);
}

/** Parses a `yyyy-mm-dd` input value as local midnight. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInput(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function selectionBounds(
  selection: Selection,
): { from: Date; to: Date } | null {
  if (selection.mode === "rolling") return null;
  if (selection.mode === "calendar") {
    return {
      from: calendarStart(selection.unit, selection.offset),
      to: calendarEnd(selection.unit, selection.offset),
    };
  }
  const from = parseDateInput(selection.from);
  const to = parseDateInput(selection.to);
  if (!from || !to || to < from) return null;
  // The custom end date is inclusive, so the exclusive bound is the next midnight.
  return {
    from,
    to: new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1),
  };
}

export function selectionQuery(selection: Selection): DashboardQuery {
  const bounds = selectionBounds(selection);
  return {
    from: bounds ? bounds.from.toISOString() : null,
    to: bounds ? bounds.to.toISOString() : null,
    timezone: TIMEZONE,
  };
}

/** Returns the immediately preceding, non-overlapping window for a selection. */
export function previousPeriodQuery(selection: Selection): DashboardQuery | null {
  if (selection.mode === "rolling") {
    if (selection.key === "total" || selection.key === "range") return null;
    const durations: Record<Exclude<PeriodKey, "total" | "range">, number> = {
      day: 24 * 60 * 60 * 1_000,
      week: 7 * 24 * 60 * 60 * 1_000,
      month: 30 * 24 * 60 * 60 * 1_000,
      year: 365 * 24 * 60 * 60 * 1_000,
    };
    const duration = durations[selection.key];
    const to = new Date();
    to.setTime(to.getTime() - duration);
    const from = new Date(to.getTime() - duration);
    return { from: from.toISOString(), to: to.toISOString(), timezone: TIMEZONE };
  }

  if (selection.mode === "calendar") {
    const bounds = selectionBounds({ ...selection, offset: selection.offset - 1 });
    if (!bounds) return null;
    return {
      from: bounds.from.toISOString(),
      to: bounds.to.toISOString(),
      timezone: TIMEZONE,
    };
  }

  const from = parseDateInput(selection.from);
  const to = parseDateInput(selection.to);
  if (!from || !to || to < from) return null;
  const dayCount = Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      (24 * 60 * 60 * 1_000),
  ) + 1;
  const previousFrom = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() - dayCount,
  );
  return {
    from: previousFrom.toISOString(),
    to: from.toISOString(),
    timezone: TIMEZONE,
  };
}

export function previousPeriodLabel(selection: Selection): string {
  if (selection.mode === "custom") return "vs prior period";
  if (selection.mode === "rolling") {
    const labels: Partial<Record<PeriodKey, string>> = {
      day: "vs prior 24 hours",
      week: "vs prior 7 days",
      month: "vs prior 30 days",
      year: "vs prior 365 days",
    };
    return labels[selection.key] ?? "vs prior period";
  }
  if (selection.unit === "day" && selection.offset === 0) return "vs yesterday";
  const labels: Record<CalendarUnit, string> = {
    day: "vs previous day",
    week: "vs previous week",
    month: "vs previous month",
    year: "vs previous year",
  };
  return labels[selection.unit];
}

export function selectionPeriodKey(selection: Selection): PeriodKey {
  return selection.mode === "rolling" ? selection.key : "range";
}

const RELATIVE_LABELS: Record<CalendarUnit, [string, string]> = {
  day: ["Today", "Yesterday"],
  week: ["This week", "Last week"],
  month: ["This month", "Last month"],
  year: ["This year", "Last year"],
};

function formatRange(unit: CalendarUnit, start: Date): string {
  const formats: Record<CalendarUnit, Intl.DateTimeFormatOptions> = {
    day: { day: "numeric", month: "short", year: "numeric" },
    week: { day: "numeric", month: "short", year: "numeric" },
    month: { month: "long", year: "numeric" },
    year: { year: "numeric" },
  };
  if (unit !== "week") {
    return new Intl.DateTimeFormat(undefined, formats[unit]).format(start);
  }
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
  );
  const short = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });
  return `${short.format(start)} – ${
    new Intl.DateTimeFormat(undefined, formats.week).format(end)
  }`;
}

export function selectionLabel(selection: Selection): string {
  if (selection.mode === "rolling") {
    return ROLLING_PERIODS.find((period) => period.key === selection.key)
      ?.label ?? "Period";
  }
  if (selection.mode === "custom") {
    const bounds = selectionBounds(selection);
    if (!bounds) return "Pick a valid range";
    const format = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const lastDay = new Date(
      bounds.to.getFullYear(),
      bounds.to.getMonth(),
      bounds.to.getDate() - 1,
    );
    return `${format.format(bounds.from)} – ${format.format(lastDay)}`;
  }
  if (selection.offset === 0) return RELATIVE_LABELS[selection.unit][0];
  if (selection.offset === -1) return RELATIVE_LABELS[selection.unit][1];
  return formatRange(
    selection.unit,
    calendarStart(selection.unit, selection.offset),
  );
}

/** Stepping forward is blocked once the range would start in the future. */
export function canStep(selection: Selection, direction: 1 | -1): boolean {
  if (selection.mode !== "calendar") return false;
  if (direction === -1) return true;
  return selection.offset < 0;
}
