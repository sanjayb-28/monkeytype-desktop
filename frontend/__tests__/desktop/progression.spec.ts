import type { CompletedEvent } from "@monkeytype/schemas/results";
import { afterEach, describe, expect, it, vi } from "vitest";

import { defaultDesktopData } from "../../src/ts/desktop/storage";
import { calculateDesktopProgression } from "../../src/ts/desktop/progression";
import { normalizeResult } from "../../src/ts/desktop/result-normalization";

const now = new Date("2026-08-09T12:00:00.000Z").getTime();

const completedResult = (
  overrides: Partial<CompletedEvent> = {},
): CompletedEvent => ({
  acc: 100,
  afkDuration: 0,
  bailedOut: false,
  blindMode: false,
  challenge: undefined,
  chartData: { burst: [80], err: [0], wpm: [80] },
  charStats: [100, 0, 0, 0],
  charTotal: 100,
  consistency: 90,
  customText: undefined,
  difficulty: "normal",
  funbox: [],
  hash: "offline-test",
  incompleteTestSeconds: 0,
  incompleteTests: [],
  keyConsistency: 90,
  keyDuration: [],
  keyOverlap: 0,
  keySpacing: [],
  language: "english",
  lastKeyToEnd: 0,
  lazyMode: false,
  mode: "time",
  mode2: "60",
  numbers: false,
  punctuation: false,
  quoteLength: -1,
  rawWpm: 84,
  restartCount: 0,
  startToFirstKey: 0,
  stopOnLetter: false,
  tags: [],
  testDuration: 60,
  timestamp: now,
  uid: "local",
  wpm: 80,
  wpmConsistency: 90,
  ...overrides,
});

afterEach(() => vi.useRealTimers());

describe("desktop progression", () => {
  it("matches the web XP modifiers for a perfect test", () => {
    vi.setSystemTime(now);
    const progression = calculateDesktopProgression(
      completedResult(),
      defaultDesktopData(),
    );

    expect(progression).toMatchObject({
      streak: 1,
      xp: 180,
      xpBreakdown: { base: 120, fullAccuracy: 60 },
    });
  });

  it("increments a next-day streak and awards the daily bonus", () => {
    vi.setSystemTime(now);
    const data = defaultDesktopData();
    data.xp = 4000;
    data.streak = 4;
    data.results = [
      normalizeResult({
        ...completedResult({ timestamp: now - 24 * 60 * 60 * 1000 }),
        _id: "yesterday",
        isPb: false,
        name: "local",
      }),
    ];

    const progression = calculateDesktopProgression(completedResult(), data);

    expect(progression.streak).toBe(5);
    expect(progression.xpBreakdown.daily).toBe(200);
    expect(progression.xp).toBe(392);
  });

  it("keeps a same-day streak and gives zen tests no XP", () => {
    vi.setSystemTime(now);
    const data = defaultDesktopData();
    data.streak = 3;
    data.results = [
      normalizeResult({
        ...completedResult({ timestamp: now - 60_000 }),
        _id: "today",
        isPb: false,
        name: "local",
      }),
    ];

    expect(
      calculateDesktopProgression(
        completedResult({ mode: "zen", mode2: "zen" }),
        data,
      ),
    ).toEqual({ streak: 3, xp: 0, xpBreakdown: {} });
  });
});
