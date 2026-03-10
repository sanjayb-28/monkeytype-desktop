// DESKTOP: Local-only DB with localStorage-backed persistence for PBs and results.

import type { PersonalBest, PersonalBests, Mode, Mode2 } from "@monkeytype/schemas/shared";
import type { Difficulty } from "@monkeytype/schemas/configs";
import type { SnapshotUserTag } from "./constants/default-snapshot";

// DESKTOP: Minimal result record stored locally
export interface LocalResult {
  wpm: number;
  rawWpm: number;
  acc: number;
  consistency: number;
  mode: string;
  mode2: string;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  difficulty: string;
  lazyMode: boolean;
  funbox: string;
  testDuration: number;
  incompleteTestSeconds: number;
  afkDuration: number;
  timestamp: number;
}

// Minimal snapshot type for local use
export interface LocalSnapshot {
  results: LocalResult[];
  personalBests: PersonalBests;
  name: string;
  customThemes: Array<{ _id: string; name: string; colors: string[] }>;
  presets: never[];
  tags: SnapshotUserTag[];
  typingStats: {
    timeTyping: number;
    startedTests: number;
    completedTests: number;
  };
  quoteRatings?: Record<string, Record<number, number>>;
  favoriteQuotes: Record<string, string[]>;
  xp: number;
  streak: number;
  maxStreak: number;
  inboxUnreadSize: number;
  connections: Record<string, never>;
  lbOptOut: boolean;
  lbMemory: Record<string, Record<string, Record<string, number>>>;
  [key: string]: unknown;
}

let dbSnapshot: LocalSnapshot | undefined;

// DESKTOP: localStorage keys
const LS_KEY_PB = "localPersonalBests";
const LS_KEY_RESULTS = "localResults";
const MAX_STORED_RESULTS = 10000;

function loadFromLocalStorage<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function saveToLocalStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", key, e);
  }
}

export class SnapshotInitError extends Error {
  public responseCode: number;
  constructor(message: string, responseCode: number) {
    super(message);
    this.name = "SnapshotInitError";
    this.responseCode = responseCode;
  }
}

function getDefaultLocalSnapshot(): LocalSnapshot {
  const savedPBs = loadFromLocalStorage<PersonalBests>(LS_KEY_PB);
  const savedResults = loadFromLocalStorage<LocalResult[]>(LS_KEY_RESULTS);

  return {
    results: savedResults ?? [],
    personalBests: savedPBs ?? {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    },
    name: "",
    customThemes: [],
    presets: [],
    tags: [],
    typingStats: {
      timeTyping: 0,
      startedTests: 0,
      completedTests: 0,
    },
    favoriteQuotes: {},
    xp: 0,
    streak: 0,
    maxStreak: 0,
    inboxUnreadSize: 0,
    connections: {},
    lbOptOut: true,
    lbMemory: { time: { "15": { english: 0 }, "60": { english: 0 } } },
  };
}

export function getSnapshot(): LocalSnapshot | undefined {
  return dbSnapshot;
}

export function setSnapshot(
  newSnapshot: LocalSnapshot | undefined,
  _options?: { dispatchEvent?: boolean }
): void {
  dbSnapshot = newSnapshot;
}

export async function initSnapshot(): Promise<LocalSnapshot | false> {
  dbSnapshot = getDefaultLocalSnapshot();
  return dbSnapshot;
}

export async function getUserResults(_offset?: number): Promise<boolean> {
  return false;
}

export async function addCustomTheme(
  theme: { name: string; colors: string[] }
): Promise<boolean> {
  if (!dbSnapshot) return false;
  dbSnapshot.customThemes ??= [];
  if (dbSnapshot.customThemes.length >= 20) return false;
  dbSnapshot.customThemes.push({
    ...theme,
    _id: `local_${Date.now()}`,
  });
  return true;
}

export async function editCustomTheme(
  themeId: string,
  newTheme: { name: string; colors: string[] }
): Promise<boolean> {
  if (!dbSnapshot) return false;
  const idx = dbSnapshot.customThemes?.findIndex((t) => t._id === themeId);
  if (idx === undefined || idx === -1) return false;
  dbSnapshot.customThemes[idx] = { ...newTheme, _id: themeId };
  return true;
}

export async function deleteCustomTheme(themeId: string): Promise<boolean> {
  if (!dbSnapshot) return false;
  dbSnapshot.customThemes = dbSnapshot.customThemes?.filter(
    (t) => t._id !== themeId
  );
  return true;
}

export async function getUserAverage10<M extends Mode>(
  _mode: M,
  _mode2: Mode2<M>,
  _punctuation: boolean,
  _numbers: boolean,
  _language: string,
  _difficulty: Difficulty,
  _lazyMode: boolean
): Promise<[number, number]> {
  const results = dbSnapshot?.results;
  if (!results || results.length === 0) return [0, 0];

  const matching = results
    .filter(
      (r) =>
        r.mode === _mode &&
        r.mode2 === String(_mode2) &&
        r.punctuation === _punctuation &&
        r.numbers === _numbers &&
        r.language === _language &&
        r.difficulty === _difficulty &&
        r.lazyMode === _lazyMode
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  if (matching.length === 0) return [0, 0];

  const avgWpm = matching.reduce((sum, r) => sum + r.wpm, 0) / matching.length;
  const avgAcc = matching.reduce((sum, r) => sum + r.acc, 0) / matching.length;
  return [avgWpm, avgAcc];
}

export async function getUserDailyBest<M extends Mode>(
  _mode: M,
  _mode2: Mode2<M>,
  _punctuation: boolean,
  _numbers: boolean,
  _language: string,
  _difficulty: Difficulty,
  _lazyMode: boolean
): Promise<number> {
  const results = dbSnapshot?.results;
  if (!results || results.length === 0) return 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  let best = 0;
  for (const r of results) {
    if (
      r.timestamp >= todayMs &&
      r.mode === _mode &&
      r.mode2 === String(_mode2) &&
      r.punctuation === _punctuation &&
      r.numbers === _numbers &&
      r.language === _language &&
      r.difficulty === _difficulty &&
      r.lazyMode === _lazyMode &&
      r.wpm > best
    ) {
      best = r.wpm;
    }
  }
  return best;
}

export async function getActiveTagsPB<M extends Mode>(
  _tagId: string,
  _mode: M,
  _mode2: Mode2<M>,
  _punctuation: boolean,
  _numbers: boolean,
  _language: string,
  _difficulty: Difficulty,
  _lazyMode: boolean
): Promise<number> {
  return 0;
}

export async function getLocalPB<M extends Mode>(
  _mode: M,
  _mode2: Mode2<M>,
  _punctuation: boolean,
  _numbers: boolean,
  _language: string,
  _difficulty: Difficulty,
  _lazyMode: boolean,
  _funboxes: unknown[]
): Promise<PersonalBest | undefined> {
  const pbs = dbSnapshot?.personalBests?.[_mode]?.[_mode2] as
    | PersonalBest[]
    | undefined;
  return pbs?.find(
    (pb) =>
      (pb.punctuation ?? false) === _punctuation &&
      (pb.numbers ?? false) === _numbers &&
      pb.difficulty === _difficulty &&
      pb.language === _language &&
      (pb.lazyMode ?? false) === _lazyMode
  );
}

export async function getLocalTagPB<M extends Mode>(
  _tagId: string,
  _mode: M,
  _mode2: Mode2<M>,
  _punctuation: boolean,
  _numbers: boolean,
  _language: string,
  _difficulty: Difficulty,
  _lazyMode: boolean
): Promise<number> {
  return 0;
}

export async function saveLocalTagPB<M extends Mode>(
  _tagId: string,
  _mode: M,
  _mode2: Mode2<M>,
  _punctuation: boolean,
  _numbers: boolean,
  _language: string,
  _difficulty: Difficulty,
  _lazyMode: boolean,
  _wpm: number,
  _acc: number,
  _raw: number,
  _consistency: number
): Promise<number | undefined> {
  return undefined;
}

export function deleteLocalTag(_tagId: string): void {
  // no-op
}

export async function updateLocalTagPB<M extends Mode>(
  _tagId: string,
  _mode: M,
  _mode2: Mode2<M>,
  _punctuation: boolean,
  _numbers: boolean,
  _language: string,
  _difficulty: Difficulty,
  _lazyMode: boolean
): Promise<void> {
  // no-op
}

export async function updateLbMemory<M extends Mode>(
  _mode: M,
  _mode2: Mode2<M> | undefined,
  _language: string,
  _rank: number,
  _api?: boolean
): Promise<void> {
  // no-op
}

export type SaveLocalResultData = {
  xp?: number;
  xpBreakdown?: unknown;
  streak?: number;
  result?: unknown;
  isPb?: boolean;
};

export function saveLocalResult(_data: SaveLocalResultData): void {
  // DESKTOP: no-op — server save path is dead code
}

// DESKTOP: Save a completed test result locally and update PBs
export function saveCompletedResult(event: {
  wpm: number;
  rawWpm: number;
  acc: number;
  consistency: number;
  mode: string;
  mode2: string;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  difficulty: string;
  lazyMode: boolean;
  funbox: string | string[];
  testDuration: number;
  incompleteTestSeconds: number;
  afkDuration: number;
}): void {
  if (!dbSnapshot) return;

  const localResult: LocalResult = {
    wpm: event.wpm,
    rawWpm: event.rawWpm,
    acc: event.acc,
    consistency: event.consistency,
    mode: event.mode,
    mode2: String(event.mode2),
    language: event.language,
    punctuation: event.punctuation ?? false,
    numbers: event.numbers ?? false,
    difficulty: event.difficulty,
    lazyMode: event.lazyMode ?? false,
    funbox: Array.isArray(event.funbox) ? event.funbox.join(",") : (event.funbox ?? "none"),
    testDuration: event.testDuration,
    incompleteTestSeconds: event.incompleteTestSeconds ?? 0,
    afkDuration: event.afkDuration ?? 0,
    timestamp: Date.now(),
  };

  // Add to results array (cap at MAX_STORED_RESULTS)
  dbSnapshot.results.push(localResult);
  if (dbSnapshot.results.length > MAX_STORED_RESULTS) {
    dbSnapshot.results = dbSnapshot.results.slice(-MAX_STORED_RESULTS);
  }
  saveToLocalStorage(LS_KEY_RESULTS, dbSnapshot.results);

  // Update PB if this is a new personal best
  updatePBIfNeeded(localResult);
}

function updatePBIfNeeded(r: LocalResult): void {
  if (!dbSnapshot) return;

  const mode = r.mode as Mode;
  const mode2 = r.mode2;

  if (!dbSnapshot.personalBests[mode]) {
    (dbSnapshot.personalBests as Record<string, Record<string, PersonalBest[]>>)[mode] = {};
  }

  const modeMap = dbSnapshot.personalBests[mode] as Record<string, PersonalBest[]>;
  if (!modeMap[mode2]) {
    modeMap[mode2] = [];
  }

  const existing = modeMap[mode2].find(
    (pb) =>
      (pb.punctuation ?? false) === r.punctuation &&
      (pb.numbers ?? false) === r.numbers &&
      pb.difficulty === r.difficulty &&
      pb.language === r.language &&
      (pb.lazyMode ?? false) === r.lazyMode
  );

  if (existing) {
    if (r.wpm > existing.wpm) {
      existing.wpm = r.wpm;
      existing.acc = r.acc;
      existing.raw = r.rawWpm;
      existing.consistency = r.consistency;
      existing.timestamp = r.timestamp;
    }
  } else {
    modeMap[mode2].push({
      acc: r.acc,
      consistency: r.consistency,
      difficulty: r.difficulty as Difficulty,
      lazyMode: r.lazyMode,
      language: r.language as PersonalBest["language"],
      punctuation: r.punctuation,
      numbers: r.numbers,
      raw: r.rawWpm,
      wpm: r.wpm,
      timestamp: r.timestamp,
    });
  }

  saveToLocalStorage(LS_KEY_PB, dbSnapshot.personalBests);
}

export function addXp(_xp: number, _breakdown?: unknown): void {
  // no-op
}

export function updateInboxUnreadSize(_newSize: number): void {
  // no-op
}

export function addBadge(_badge: unknown): void {
  // no-op
}

export async function getTestActivityCalendar(
  _yearString: string
): Promise<undefined> {
  return undefined;
}

export function mergeConnections(_connections: unknown[]): void {
  // no-op
}
