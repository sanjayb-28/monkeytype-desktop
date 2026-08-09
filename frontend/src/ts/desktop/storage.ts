import type { Language } from "@monkeytype/schemas/languages";
import { PresetSchema, type Preset } from "@monkeytype/schemas/presets";
import type {
  Mode,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import {
  CustomThemeSchema,
  type CustomTheme,
  ResultFiltersSchema,
  type ResultFilters,
  UserTagSchema,
  type UserTag,
} from "@monkeytype/schemas/users";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { SnapshotResult } from "../constants/default-snapshot";

import { getDesktopPersonalBestDecision } from "./personal-best";
import { normalizeResult } from "./result-normalization";

const legacyStorageKey = "monkeytype.desktop.data.v1";
const defaultDatabaseName = "monkeytype-desktop-data";
const metadataKey = "snapshot";

export type DesktopData = {
  customThemes: CustomTheme[];
  favoriteQuotes: Partial<Record<Language, string[]>>;
  personalBests: PersonalBests;
  presets: Preset[];
  resultFilterPresets: ResultFilters[];
  results: SnapshotResult<Mode>[];
  tags: (UserTag & { active: boolean })[];
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
  customThemes: [],
  favoriteQuotes: {},
  personalBests: {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
  },
  presets: [],
  resultFilterPresets: [],
  results: [],
  tags: [],
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
  customThemes: data.customThemes,
  favoriteQuotes: data.favoriteQuotes,
  personalBests: data.personalBests,
  presets: data.presets,
  resultFilterPresets: data.resultFilterPresets,
  tags: data.tags,
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
    customThemes: sanitizeCustomThemes(candidate.customThemes),
    favoriteQuotes: candidate.favoriteQuotes ?? {},
    personalBests:
      candidate.personalBests ?? structuredClone(fallback.personalBests),
    presets: sanitizePresets(candidate.presets),
    resultFilterPresets: sanitizeResultFilterPresets(
      candidate.resultFilterPresets,
    ),
    tags: sanitizeTags(candidate.tags),
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

const sanitizePresets = (value: unknown): Preset[] =>
  Array.isArray(value)
    ? value.flatMap((preset) => {
        if (typeof preset !== "object" || preset === null) return [];
        const candidate = preset as Record<string, unknown>;
        const parsed = PresetSchema.safeParse({
          ...candidate,
          name:
            typeof candidate["name"] === "string"
              ? candidate["name"].replace(/ /g, "_")
              : candidate["name"],
        });
        return parsed.success
          ? [{ ...parsed.data, name: parsed.data.name.replace(/_/g, " ") }]
          : [];
      })
    : [];

const sanitizeCustomThemes = (value: unknown): CustomTheme[] =>
  Array.isArray(value)
    ? value.flatMap((theme) => {
        const parsed = CustomThemeSchema.safeParse(theme);
        return parsed.success ? [parsed.data] : [];
      })
    : [];

const sanitizeResultFilterPresets = (value: unknown): ResultFilters[] =>
  Array.isArray(value)
    ? value.flatMap((preset) => {
        if (typeof preset !== "object" || preset === null) return [];
        const candidate = preset as Record<string, unknown>;
        const parsed = ResultFiltersSchema.safeParse({
          ...candidate,
          name:
            typeof candidate["name"] === "string"
              ? candidate["name"].replace(/ /g, "_")
              : candidate["name"],
        });
        return parsed.success
          ? [{ ...parsed.data, name: parsed.data.name.replace(/_/g, " ") }]
          : [];
      })
    : [];

const sanitizeTags = (value: unknown): (UserTag & { active: boolean })[] =>
  Array.isArray(value)
    ? value.flatMap((tag) => {
        if (typeof tag !== "object" || tag === null) return [];
        const { active, ...candidate } = tag as Record<string, unknown>;
        const parsed = UserTagSchema.safeParse({
          ...candidate,
          name:
            typeof candidate["name"] === "string"
              ? candidate["name"].replace(/ /g, "_")
              : candidate["name"],
        });
        return parsed.success
          ? [
              {
                ...parsed.data,
                name: parsed.data.name.replace(/_/g, " "),
                active: active === true,
              },
            ]
          : [];
      })
    : [];

const rebuildHistoryMetadata = (
  current: DesktopData,
  results: SnapshotResult<Mode>[],
): DesktopData => {
  const personalBests = defaultDesktopData().personalBests;
  for (const result of results) {
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
    if (
      !getDesktopPersonalBestDecision(result, currentBest?.wpm).isPersonalBest
    ) {
      continue;
    }

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
    const initializedData = this.load();
    dispatchUpdatedEvent();
    return initializedData;
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

  async updateResultTags(resultId: string, tags: string[]): Promise<void> {
    return this.enqueue(async () => {
      const result = this.cache.results.find((item) => item._id === resultId);
      if (result === undefined) throw new Error("Local result not found");

      const updated = { ...result, tags: [...tags] };
      const database = await this.dbPromise;
      await database.put("results", updated);
      this.cache = {
        ...this.cache,
        results: this.cache.results.map((item) =>
          item._id === resultId ? updated : item,
        ),
      };
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

export const updateDesktopResultTags = async (
  resultId: string,
  tags: string[],
): Promise<void> => getDesktopStorage().updateResultTags(resultId, tags);

export const clearDesktopData = async (): Promise<void> =>
  getDesktopStorage().clear();
