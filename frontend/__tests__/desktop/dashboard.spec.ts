import { describe, expect, it } from "vitest";

import type { SnapshotResult } from "../../src/ts/constants/default-snapshot";
import {
  buildActivityCalendar,
  calculateDashboardStats,
  defaultDashboardFilters,
  filterDashboardResults,
  getPersonalBests,
  groupDailyActivity,
  resultsToCsv,
  sortDashboardResults,
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
    const filters = {
      ...defaultDashboardFilters(),
      mode: "words" as const,
      pbOnly: true,
      punctuation: true,
      range: "30d" as const,
    };

    expect(filterDashboardResults([recentPb, oldResult], filters, now)).toEqual(
      [recentPb],
    );
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

  it("groups activity by local day", () => {
    const grouped = groupDailyActivity([
      result({ timeTyping: 20, wpm: 70 }),
      result({ timeTyping: 40, wpm: 90 }),
      result({ timestamp: now - day, wpm: 100 }),
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[1]).toMatchObject({
      averageWpm: 80,
      completed: 2,
      timeTyping: 60,
    });
  });

  it("builds a complete calendar and activity levels", () => {
    const calendar = buildActivityCalendar(
      [result(), result({ timestamp: now - day })],
      2026,
    );
    expect(calendar.length).toBeGreaterThanOrEqual(365);
    expect(calendar.filter((item) => item.count > 0)).toHaveLength(2);
  });

  it("derives the fastest result for each standard personal-best slot", () => {
    const bests = getPersonalBests([
      result({ wpm: 80 }),
      result({ wpm: 100 }),
      result({ mode2: "25", wpm: 90 }),
    ]);
    expect(bests).toHaveLength(2);
    expect(bests.find((item) => item.mode2 === "10")?.wpm).toBe(100);
  });

  it("sorts without mutating input and produces CSV", () => {
    const slow = result({ wpm: 60 });
    const fast = result({ wpm: 100 });
    const source = [slow, fast];
    expect(
      sortDashboardResults(source, { direction: "desc", field: "wpm" })[0],
    ).toBe(fast);
    expect(source[0]).toBe(slow);
    expect(resultsToCsv([slow])).toContain("timestamp,mode,mode2,language");
    expect(resultsToCsv([slow])).toContain("english,60,84");
  });
});
