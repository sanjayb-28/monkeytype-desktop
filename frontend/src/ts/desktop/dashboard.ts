import type { Mode } from "@monkeytype/schemas/shared";

import type { SnapshotResult } from "../constants/default-snapshot";

export const dashboardRanges = ["all", "7d", "30d", "90d", "1y"] as const;
export type DashboardRange = (typeof dashboardRanges)[number];

export type DashboardFilters = {
  language: string;
  mode: "all" | Mode;
  numbers: boolean | null;
  pbOnly: boolean;
  punctuation: boolean | null;
  range: DashboardRange;
};

export type DashboardSort = {
  direction: "asc" | "desc";
  field: "acc" | "consistency" | "timestamp" | "wpm";
};

export type DashboardStats = {
  averageAccuracy: number;
  averageConsistency: number;
  averageWpm: number;
  bestAccuracy: number;
  bestWpm: number;
  completed: number;
  estimatedWords: number;
  lastTenWpm: number;
  timeTyping: number;
};

export type DailyActivity = {
  averageWpm: number;
  completed: number;
  dayTimestamp: number;
  timeTyping: number;
};

export type CalendarDay = {
  count: number;
  date: Date;
  key: string;
  level: 0 | 1 | 2 | 3 | 4;
  timeTyping: number;
};

export type PersonalBest = {
  acc: number;
  consistency: number;
  mode: "time" | "words";
  mode2: string;
  rawWpm: number;
  timestamp: number;
  wpm: number;
};

export const defaultDashboardFilters = (): DashboardFilters => ({
  language: "all",
  mode: "all",
  numbers: null,
  pbOnly: false,
  punctuation: null,
  range: "all",
});

const average = (values: number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

const startOfLocalDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export function filterDashboardResults(
  results: SnapshotResult<Mode>[],
  filters: DashboardFilters,
  now = Date.now(),
): SnapshotResult<Mode>[] {
  const rangeDays: Record<Exclude<DashboardRange, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };
  const cutoff =
    filters.range === "all"
      ? 0
      : startOfLocalDay(now) -
        (rangeDays[filters.range] - 1) * 24 * 60 * 60 * 1000;

  return results.filter(
    (result) =>
      result.timestamp >= cutoff &&
      (filters.mode === "all" || result.mode === filters.mode) &&
      (filters.language === "all" || result.language === filters.language) &&
      (filters.punctuation === null ||
        result.punctuation === filters.punctuation) &&
      (filters.numbers === null || result.numbers === filters.numbers) &&
      (!filters.pbOnly || result.isPb === true),
  );
}

export function sortDashboardResults(
  results: SnapshotResult<Mode>[],
  sorting: DashboardSort,
): SnapshotResult<Mode>[] {
  const direction = sorting.direction === "asc" ? 1 : -1;
  return [...results].sort(
    (left, right) => (left[sorting.field] - right[sorting.field]) * direction,
  );
}

export function calculateDashboardStats(
  results: SnapshotResult<Mode>[],
): DashboardStats {
  const lastTen = [...results]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 10);

  return {
    averageAccuracy: average(results.map((result) => result.acc)),
    averageConsistency: average(results.map((result) => result.consistency)),
    averageWpm: average(results.map((result) => result.wpm)),
    bestAccuracy: Math.max(0, ...results.map((result) => result.acc)),
    bestWpm: Math.max(0, ...results.map((result) => result.wpm)),
    completed: results.length,
    estimatedWords: results.reduce((total, result) => total + result.words, 0),
    lastTenWpm: average(lastTen.map((result) => result.wpm)),
    timeTyping: results.reduce((total, result) => total + result.timeTyping, 0),
  };
}

export function groupDailyActivity(
  results: SnapshotResult<Mode>[],
): DailyActivity[] {
  const days = new Map<
    number,
    { completed: number; timeTyping: number; totalWpm: number }
  >();

  for (const result of results) {
    const dayTimestamp = startOfLocalDay(result.timestamp);
    const day = days.get(dayTimestamp) ?? {
      completed: 0,
      timeTyping: 0,
      totalWpm: 0,
    };
    day.completed += 1;
    day.timeTyping += result.timeTyping;
    day.totalWpm += result.wpm;
    days.set(dayTimestamp, day);
  }

  return [...days.entries()]
    .sort(([left], [right]) => left - right)
    .map(([dayTimestamp, day]) => ({
      averageWpm: day.totalWpm / day.completed,
      completed: day.completed,
      dayTimestamp,
      timeTyping: day.timeTyping,
    }));
}

export function buildActivityCalendar(
  results: SnapshotResult<Mode>[],
  year: number,
): CalendarDay[] {
  const counts = new Map<number, { count: number; timeTyping: number }>();
  for (const result of results) {
    const day = startOfLocalDay(result.timestamp);
    const current = counts.get(day) ?? { count: 0, timeTyping: 0 };
    current.count += 1;
    current.timeTyping += result.timeTyping;
    counts.set(day, current);
  }

  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(year, 11, 31);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const activeCounts = [...counts.entries()]
    .filter(([timestamp]) => new Date(timestamp).getFullYear() === year)
    .map(([, value]) => value.count)
    .sort((left, right) => left - right);
  const upperQuartile =
    activeCounts[Math.max(0, Math.floor(activeCounts.length * 0.75) - 1)] ?? 1;

  const days: CalendarDay[] = [];
  for (
    const date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const timestamp = startOfLocalDay(date.getTime());
    const activity = counts.get(timestamp) ?? { count: 0, timeTyping: 0 };
    const ratio = activity.count / upperQuartile;
    const level: CalendarDay["level"] =
      activity.count === 0
        ? 0
        : ratio <= 0.25
          ? 1
          : ratio <= 0.5
            ? 2
            : ratio <= 1
              ? 3
              : 4;
    days.push({
      count: activity.count,
      date: new Date(date),
      key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      level,
      timeTyping: activity.timeTyping,
    });
  }
  return days;
}

export function getPersonalBests(
  results: SnapshotResult<Mode>[],
): PersonalBest[] {
  const bests = new Map<string, PersonalBest>();
  for (const result of results) {
    if (result.mode !== "time" && result.mode !== "words") continue;
    const key = `${result.mode}:${result.mode2}`;
    const current = bests.get(key);
    if (current !== undefined && current.wpm >= result.wpm) continue;
    bests.set(key, {
      acc: result.acc,
      consistency: result.consistency,
      mode: result.mode,
      mode2: result.mode2,
      rawWpm: result.rawWpm,
      timestamp: result.timestamp,
      wpm: result.wpm,
    });
  }
  return [...bests.values()];
}

const csvEscape = (
  value: boolean | number | string | null | undefined,
): string => {
  const stringValue = String(value ?? "");
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue;
};

export function resultsToCsv(results: SnapshotResult<Mode>[]): string {
  const columns = [
    "timestamp",
    "mode",
    "mode2",
    "language",
    "wpm",
    "rawWpm",
    "accuracy",
    "consistency",
    "testDuration",
    "punctuation",
    "numbers",
    "personalBest",
  ] as const;
  const rows = results.map((result) => [
    new Date(result.timestamp).toISOString(),
    result.mode,
    result.mode2,
    result.language,
    result.wpm,
    result.rawWpm,
    result.acc,
    result.consistency,
    result.testDuration,
    result.punctuation,
    result.numbers,
    result.isPb === true,
  ]);
  return [columns, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}
