import { getFunbox } from "@monkeytype/funbox";
import type { Language } from "@monkeytype/schemas/languages";
import type {
  Mode,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { SnapshotResult } from "../constants/default-snapshot";

import { normalizeResult } from "./result-normalization";

const legacyStorageKey = "monkeytype.desktop.data.v1";
const defaultDatabaseName = "monkeytype-desktop-data";
const metadataKey = "snapshot";

export type DesktopData = {
  favoriteQuotes: Partial<Record<Language, string[]>>;
  personalBests: PersonalBests;
  results: SnapshotResult<Mode>[];
  typingStats: {
    timeTyping: number;
    startedTests: number;
    completedTests: number;
  };
  xp: number;
  streak: number;
  maxStreak: number;
};

type DesktopMetadata = Omit<DesktopData, "results">;

type DesktopDatabase = DBSchema & {
  metadata: {
    key: string;
    value: DesktopMetadata;
  };
  results: {
    key: string;
    value: SnapshotResult<Mode>;
    indexes: { timestamp: number };
  };
};

export const defaultDesktopData = (): DesktopData => ({
  favoriteQuotes: {},
  personalBests: {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
  },
  results: [],
  typingStats: {
    timeTyping: 0,
    startedTests: 0,
    completedTests: 0,
  },
  xp: 0,
  streak: 0,
  maxStreak: 0,
});

const metadataFromData = (data: DesktopData): DesktopMetadata => ({
  favoriteQuotes: data.favoriteQuotes,
  personalBests: data.personalBests,
  typingStats: data.typingStats,
  xp: data.xp,
  streak: data.streak,
  maxStreak: data.maxStreak,
});

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isResultCandidate = (value: unknown): value is SnapshotResult<Mode> => {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<SnapshotResult<Mode>>;
  return (
    typeof result._id === "string" &&
    result._id.length > 0 &&
    isFiniteNumber(result.timestamp) &&
    isFiniteNumber(result.wpm) &&
    isFiniteNumber(result.rawWpm) &&
    isFiniteNumber(result.acc) &&
    isFiniteNumber(result.consistency) &&
    isFiniteNumber(result.testDuration) &&
    typeof result.mode === "string" &&
    typeof result.mode2 === "string"
  );
};

const safeNonNegativeNumber = (value: unknown): number =>
  isFiniteNumber(value) && value >= 0 ? value : 0;

const sanitizeMetadata = (value: unknown): DesktopMetadata => {
  const fallback = defaultDesktopData();
  if (typeof value !== "object" || value === null) {
    return metadataFromData(fallback);
  }
  const candidate = value as Partial<DesktopMetadata>;
  const typingStats = candidate.typingStats;
  return {
    favoriteQuotes: candidate.favoriteQuotes ?? {},
    personalBests:
      candidate.personalBests ?? structuredClone(fallback.personalBests),
    typingStats: {
      completedTests: safeNonNegativeNumber(typingStats?.completedTests),
      startedTests: safeNonNegativeNumber(typingStats?.startedTests),
      timeTyping: safeNonNegativeNumber(typingStats?.timeTyping),
    },
    xp: safeNonNegativeNumber(candidate.xp),
    streak: safeNonNegativeNumber(candidate.streak),
    maxStreak: safeNonNegativeNumber(candidate.maxStreak),
  };
};

const sanitizeResults = (value: unknown): SnapshotResult<Mode>[] =>
  Array.isArray(value)
    ? value.filter(isResultCandidate).map((result) => normalizeResult(result))
    : [];

const rebuildHistoryMetadata = (
  current: DesktopData,
  results: SnapshotResult<Mode>[],
): DesktopData => {
  const personalBests = defaultDesktopData().personalBests;
  for (const result of results) {
    if (
      result.mode === "quote" ||
      !getFunbox(result.funbox).every((funbox) => funbox.canGetPb)
    ) {
      continue;
    }

    const modeBests = personalBests[result.mode] as Record<
      string,
      PersonalBest[]
    >;
    const candidates = (modeBests[result.mode2] ??= []);
    const currentBest = candidates.find(
      (best) =>
        (best.punctuation ?? false) === result.punctuation &&
        (best.numbers ?? false) === result.numbers &&
        best.difficulty === result.difficulty &&
        best.language === result.language &&
        (best.lazyMode ?? false) === result.lazyMode,
    );
    if (currentBest !== undefined && currentBest.wpm >= result.wpm) continue;

    const best: PersonalBest = {
      acc: result.acc,
      consistency: result.consistency,
      difficulty: result.difficulty,
      language: result.language,
      lazyMode: result.lazyMode,
      numbers: result.numbers,
      punctuation: result.punctuation,
      raw: result.rawWpm,
      timestamp: result.timestamp,
      wpm: result.wpm,
    };
    if (currentBest === undefined) candidates.push(best);
    else Object.assign(currentBest, best);
  }

  return {
    ...current,
    personalBests,
    results,
    typingStats: {
      completedTests: results.length,
      startedTests: results.reduce(
        (total, result) => total + result.restartCount + 1,
        0,
      ),
      timeTyping: results.reduce(
        (total, result) =>
          total +
          Math.max(
            0,
            result.testDuration +
              result.incompleteTestSeconds -
              result.afkDuration,
          ),
        0,
      ),
    },
  };
};

const readLegacyData = (storage: Storage | undefined): DesktopData | null => {
  if (storage === undefined) return null;
  try {
    const serialized = storage.getItem(legacyStorageKey);
    if (serialized === null) return null;
    const parsed = JSON.parse(serialized) as Partial<DesktopData>;
    return {
      ...sanitizeMetadata(parsed),
      results: sanitizeResults(parsed.results),
    };
  } catch (error) {
    console.error("Failed to migrate legacy Monkeytype desktop data", error);
    return null;
  }
};

export class DesktopStorage {
  private readonly dbPromise: Promise<IDBPDatabase<DesktopDatabase>>;
  private readonly legacyStorage: Storage | undefined;
  private cache = defaultDesktopData();
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    databaseName = defaultDatabaseName,
    legacyStorage: Storage | undefined = globalThis.localStorage,
  ) {
    this.legacyStorage = legacyStorage;
    this.dbPromise = openDB<DesktopDatabase>(databaseName, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("metadata")) {
          database.createObjectStore("metadata");
        }
        if (!database.objectStoreNames.contains("results")) {
          const results = database.createObjectStore("results", {
            keyPath: "_id",
          });
          results.createIndex("timestamp", "timestamp");
        }
      },
    });
  }

  async initialize(): Promise<DesktopData> {
    if (this.initialized) return this.load();

    const database = await this.dbPromise;
    const [storedMetadata, storedResults] = await Promise.all([
      database.get("metadata", metadataKey),
      database.getAllFromIndex("results", "timestamp"),
    ]);

    if (storedMetadata === undefined && storedResults.length === 0) {
      const legacy = readLegacyData(this.legacyStorage);
      if (legacy !== null) {
        await this.replaceImmediately(database, legacy);
        this.legacyStorage?.removeItem(legacyStorageKey);
        this.cache = legacy;
      }
    } else {
      this.cache = {
        ...sanitizeMetadata(storedMetadata),
        results: sanitizeResults(storedResults),
      };
    }

    this.initialized = true;
    return this.load();
  }

  load(): DesktopData {
    return structuredClone(this.cache);
  }

  async save(
    update: Partial<Omit<DesktopData, "results">> & {
      appendResult?: SnapshotResult<Mode>;
    },
  ): Promise<void> {
    return this.enqueue(async () => {
      const database = await this.dbPromise;
      const { appendResult, ...fields } = update;
      const next: DesktopData = { ...this.cache, ...fields };
      const transaction = database.transaction(
        ["metadata", "results"],
        "readwrite",
      );

      if (appendResult !== undefined) {
        const normalized = normalizeResult(appendResult);
        await transaction.objectStore("results").put(normalized);
        next.results = [...this.cache.results, normalized];
      }
      await transaction
        .objectStore("metadata")
        .put(metadataFromData(next), metadataKey);
      await transaction.done;
      this.cache = next;
      dispatchUpdatedEvent();
    });
  }

  async replace(data: DesktopData): Promise<void> {
    return this.enqueue(async () => {
      const database = await this.dbPromise;
      const sanitized: DesktopData = {
        ...sanitizeMetadata(data),
        results: sanitizeResults(data.results),
      };
      await this.replaceImmediately(database, sanitized);
      this.cache = sanitized;
      dispatchUpdatedEvent();
    });
  }

  async deleteResult(resultId: string): Promise<void> {
    return this.enqueue(async () => {
      const database = await this.dbPromise;
      const results = this.cache.results.filter(
        (result) => result._id !== resultId,
      );
      const next = rebuildHistoryMetadata(this.cache, results);
      const transaction = database.transaction(
        ["metadata", "results"],
        "readwrite",
      );
      await transaction.objectStore("results").delete(resultId);
      await transaction
        .objectStore("metadata")
        .put(metadataFromData(next), metadataKey);
      await transaction.done;
      this.cache = next;
      dispatchUpdatedEvent();
    });
  }

  async clear(): Promise<void> {
    return this.replace(defaultDesktopData());
  }

  close(): void {
    void this.dbPromise.then((database) => database.close());
  }

  private async enqueue(operation: () => Promise<void>): Promise<void> {
    const queued = this.writeQueue.then(operation, operation);
    this.writeQueue = queued.catch(() => undefined);
    return queued;
  }

  private async replaceImmediately(
    database: IDBPDatabase<DesktopDatabase>,
    data: DesktopData,
  ): Promise<void> {
    const transaction = database.transaction(
      ["metadata", "results"],
      "readwrite",
    );
    await transaction.objectStore("results").clear();
    for (const result of data.results) {
      await transaction.objectStore("results").put(normalizeResult(result));
    }
    await transaction
      .objectStore("metadata")
      .put(metadataFromData(data), metadataKey);
    await transaction.done;
  }
}

const dispatchUpdatedEvent = (): void => {
  globalThis.window?.dispatchEvent(
    new CustomEvent("monkeytype:desktop-data-updated"),
  );
};

let desktopStorage: DesktopStorage | undefined;

const getDesktopStorage = (): DesktopStorage =>
  (desktopStorage ??= new DesktopStorage());

export const initializeDesktopStorage = async (): Promise<DesktopData> =>
  getDesktopStorage().initialize();

export const loadDesktopData = (): DesktopData => getDesktopStorage().load();

export const saveDesktopData = async (
  update: Partial<Omit<DesktopData, "results">> & {
    appendResult?: SnapshotResult<Mode>;
  },
): Promise<void> => getDesktopStorage().save(update);

export const replaceDesktopData = async (data: DesktopData): Promise<void> =>
  getDesktopStorage().replace(data);

export const deleteDesktopResult = async (resultId: string): Promise<void> =>
  getDesktopStorage().deleteResult(resultId);

export const clearDesktopData = async (): Promise<void> =>
  getDesktopStorage().clear();
