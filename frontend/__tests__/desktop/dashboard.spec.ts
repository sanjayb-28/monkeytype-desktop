import { describe, expect, it } from "vitest";

import type { SnapshotResult } from "../../src/ts/constants/default-snapshot";
import defaultResultFilters from "../../src/ts/constants/default-result-filters";
import {
  calculateDashboardStats,
  filterDashboardResults,
  resultsToCsv,
} from "../../src/ts/desktop/dashboard";

const day = 24 * 60 * 60 * 1000;
const now = new Date(2026, 7, 8, 12).getTime();

const result = (
  overrides: Partial<SnapshotResult<"words">> = {},
): SnapshotResult<"words"> => ({
  _id: crypto.randomUUID(),
  acc: 98,
  afkDuration: 0,
  bailedOut: false,
  blindMode: false,
  chartData: { burst: [80], err: [0], wpm: [80] },
  charStats: [40, 0, 0, 0],
  consistency: 90,
  dayTimestamp: now,
  difficulty: "normal",
  funbox: [],
  incompleteTestSeconds: 0,
  isPb: false,
  keyConsistency: 90,
  language: "english",
  lazyMode: false,
  mode: "words",
  mode2: "10",
  name: "local",
  numbers: false,
  punctuation: false,
  quoteLength: -1,
  rawWpm: 84,
  restartCount: 0,
  tags: [],
  testDuration: 10,
  timeTyping: 10,
  timestamp: now,
  uid: "local",
  words: 10,
  wpm: 80,
  ...overrides,
});

describe("desktop dashboard", () => {
  it("filters by date, mode, traits and personal best", () => {
    const recentPb = result({ isPb: true, punctuation: true });
    const oldResult = result({ timestamp: now - 40 * day });
    const filters = structuredClone(defaultResultFilters);
    Object.keys(filters.mode).forEach(
      (mode) => (filters.mode[mode as keyof typeof filters.mode] = false),
    );
    filters.mode.words = true;
    filters.pb.no = false;
    filters.punctuation.off = false;
    filters.date.all = false;
    filters.date.last_month = true;

    expect(filterDashboardResults([recentPb, oldResult], filters, now)).toEqual(
      [recentPb],
    );
  });

  it("uses local calendar days across daylight-saving transitions", () => {
    const dstNow = new Date(2026, 10, 7, 12).getTime();
    const firstIncludedDay = new Date(2026, 10, 1, 0, 30).getTime();
    const filters = structuredClone(defaultResultFilters);
    filters.date.all = false;
    filters.date.last_week = true;

    expect(
      filterDashboardResults(
        [result({ timestamp: firstIncludedDay })],
        filters,
        dstNow,
      ),
    ).toHaveLength(1);
  });

  it("calculates aggregate and last-ten statistics", () => {
    const results = [
      result({ acc: 90, consistency: 80, timeTyping: 30, words: 40, wpm: 60 }),
      result({
        acc: 100,
        consistency: 100,
        timeTyping: 60,
        words: 80,
        wpm: 100,
      }),
    ];
    expect(calculateDashboardStats(results)).toEqual({
      averageAccuracy: 95,
      averageConsistency: 90,
      averageWpm: 80,
      bestAccuracy: 100,
      bestWpm: 100,
      completed: 2,
      estimatedWords: 120,
      lastTenWpm: 80,
      timeTyping: 90,
    });
  });

  it("produces CSV without mutating input", () => {
    const slow = result({ wpm: 60 });
    expect(resultsToCsv([slow])).toContain("timestamp,mode,mode2,language");
    expect(resultsToCsv([slow])).toContain("english,60,84");
  });
});
