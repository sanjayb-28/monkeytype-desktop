import type { Mode } from "@monkeytype/schemas/shared";
import type { ResultFilters } from "@monkeytype/schemas/users";

import type { SnapshotResult } from "../constants/default-snapshot";

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

const average = (values: number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

export function filterDashboardResults(
  results: SnapshotResult<Mode>[],
  filters: ResultFilters,
  now = Date.now(),
): SnapshotResult<Mode>[] {
  const enabled = <T extends string>(
    values: Partial<Record<T, boolean>>,
  ): T[] =>
    Object.entries(values)
      .filter(([, selected]) => selected === true)
      .map(([value]) => value as T);
  const enabledBooleans = (
    values: Record<"on" | "off", boolean> | Record<"yes" | "no", boolean>,
  ): boolean[] =>
    Object.entries(values)
      .filter(([, selected]) => selected)
      .map(([value]) => value === "on" || value === "yes");
  const dateSeconds: Record<keyof ResultFilters["date"], number> = {
    all: 0,
    last_day: 24 * 60 * 60,
    last_week: 7 * 24 * 60 * 60,
    last_month: 30 * 24 * 60 * 60,
    last_3months: 90 * 24 * 60 * 60,
  };
  const selectedDate = enabled(filters.date)[0] ?? "all";
  const cutoff =
    selectedDate === "all" ? 0 : now - dateSeconds[selectedDate] * 1000;
  const selectedDifficulties = enabled(filters.difficulty);
  const selectedPb = enabledBooleans(filters.pb);
  const selectedModes = enabled(filters.mode);
  const selectedWords = enabled(filters.words);
  const selectedTimes = enabled(filters.time);
  const selectedPunctuation = enabledBooleans(filters.punctuation);
  const selectedNumbers = enabledBooleans(filters.numbers);
  const quoteLengthMap = { short: 0, medium: 1, long: 2, thicc: 3 } as const;
  const selectedQuoteLengths: number[] = enabled(filters.quoteLength).map(
    (length) => quoteLengthMap[length],
  );
  const selectedTags = enabled(filters.tags);
  const selectedFunboxes = enabled(filters.funbox);
  const selectedLanguages = enabled(filters.language);

  const matchesMode2 = (
    result: SnapshotResult<Mode>,
    mode: "time" | "words",
    selected: string[],
    standard: string[],
  ): boolean => {
    if (result.mode !== mode || selected.length === 5) return true;
    return (
      selected.includes(result.mode2) ||
      (selected.includes("custom") && !standard.includes(result.mode2))
    );
  };

  const matchesCollection = (
    selected: string[],
    resultValues: string[],
  ): boolean =>
    selected.some((value) =>
      value === "none"
        ? resultValues.length === 0
        : resultValues.includes(value),
    );

  return results.filter(
    (result) =>
      result.timestamp >= cutoff &&
      selectedDifficulties.includes(result.difficulty) &&
      selectedPb.includes(result.isPb === true) &&
      selectedModes.includes(result.mode) &&
      selectedPunctuation.includes(result.punctuation) &&
      selectedNumbers.includes(result.numbers) &&
      (result.quoteLength === -1 ||
        selectedQuoteLengths.includes(result.quoteLength)) &&
      selectedLanguages.includes(result.language) &&
      matchesCollection(selectedTags, result.tags) &&
      matchesCollection(selectedFunboxes, result.funbox) &&
      matchesMode2(result, "time", selectedTimes, ["15", "30", "60", "120"]) &&
      matchesMode2(result, "words", selectedWords, ["10", "25", "50", "100"]),
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
