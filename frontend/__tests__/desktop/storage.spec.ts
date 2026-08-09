import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import type { SnapshotResult } from "../../src/ts/constants/default-snapshot";
import { normalizeResult } from "../../src/ts/desktop/result-normalization";
import {
  defaultDesktopData,
  DesktopStorage,
} from "../../src/ts/desktop/storage";

const databaseNames: string[] = [];
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

const createStorage = (
  legacyStorage: Storage = localStorage,
): DesktopStorage => {
  const databaseName = `monkeytype-desktop-test-${crypto.randomUUID()}`;
  databaseNames.push(databaseName);
  return new DesktopStorage(databaseName, legacyStorage);
};

afterEach(async () => {
  localStorage.clear();
  await Promise.all(
    databaseNames.splice(0).map(
      async (databaseName) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(databaseName);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          request.onblocked = () => resolve();
        }),
    ),
  );
});

describe("desktop storage", () => {
  it("normalizes a completed-event shaped result before persistence", async () => {
    const storage = createStorage();
    await storage.initialize();
    const input = result();
    const incomplete = {
      ...input,
      dayTimestamp: undefined,
      name: undefined,
      timeTyping: undefined,
      words: undefined,
    };

    const normalized = normalizeResult(incomplete);
    await storage.save({ appendResult: normalized });

    expect(storage.load().results[0]).toMatchObject({
      dayTimestamp: new Date(2026, 7, 8).getTime(),
      name: "local",
      timeTyping: 10,
      words: 13,
    });
    storage.close();
  });

  it("migrates legacy localStorage history once", async () => {
    const legacy = defaultDesktopData();
    legacy.results = [result()];
    localStorage.setItem("monkeytype.desktop.data.v1", JSON.stringify(legacy));
    const storage = createStorage();

    await storage.initialize();

    expect(storage.load().results).toHaveLength(1);
    expect(localStorage.getItem("monkeytype.desktop.data.v1")).toBeNull();
    storage.close();
  });

  it("retains histories larger than the former 10,000-result cap", async () => {
    const storage = createStorage();
    await storage.initialize();
    const data = defaultDesktopData();
    data.results = Array.from({ length: 10_001 }, (_, index) =>
      result({ _id: `result-${index}`, timestamp: now + index }),
    );

    await storage.replace(data);

    expect(storage.load().results).toHaveLength(10_001);
    storage.close();
  });

  it("rejects failed writes and continues processing later writes", async () => {
    const storage = createStorage();
    await storage.initialize();
    const invalid = {
      ...result(),
      chartData: () => undefined,
    } as unknown as SnapshotResult<"words">;

    await expect(storage.save({ appendResult: invalid })).rejects.toThrow();
    await storage.save({ appendResult: result() });

    expect(storage.load().results).toHaveLength(1);
    storage.close();
  });

  it("recalculates personal bests and typing totals after deletion", async () => {
    const storage = createStorage();
    await storage.initialize();
    const fast = result({ _id: "fast", isPb: true, wpm: 100 });
    const slow = result({ _id: "slow", wpm: 80 });
    await storage.replace({
      ...defaultDesktopData(),
      results: [fast, slow],
    });

    await storage.deleteResult("fast");

    const data = storage.load();
    expect(data.results).toHaveLength(1);
    expect(data.results[0]).toMatchObject({ _id: "slow", wpm: 80 });
    expect(data.typingStats.completedTests).toBe(1);
    expect(data.personalBests.words["10"]?.[0]?.wpm).toBe(80);
    storage.close();
  });
});
