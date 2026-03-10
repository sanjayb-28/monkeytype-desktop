// DESKTOP: Local-only DB stub replacing the server snapshot system.
// This file is aliased via Vite resolve.alias to replace the original db.ts
// For Phase 1, returns empty/undefined. Phase 3 will wire SQLite persistence.

import type { PersonalBest, PersonalBests, Mode, Mode2 } from "@monkeytype/schemas/shared";
import type { Difficulty } from "@monkeytype/schemas/configs";

// Minimal snapshot type for local use — avoids importing removed schemas (users, presets, connections)
export interface LocalSnapshot {
  results: undefined;
  personalBests: PersonalBests;
  name: string;
  customThemes: Array<{ _id: string; name: string; colors: string[] }>;
  presets: never[];
  tags: never[];
  typingStats: {
    timeTyping: number;
    startedTests: number;
    completedTests: number;
  };
  favoriteQuotes: Record<string, never>;
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

export class SnapshotInitError extends Error {
  public responseCode: number;
  constructor(message: string, responseCode: number) {
    super(message);
    this.name = "SnapshotInitError";
    this.responseCode = responseCode;
  }
}

function getDefaultLocalSnapshot(): LocalSnapshot {
  return {
    results: undefined,
    personalBests: {
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
  return [0, 0];
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
  return 0;
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
  // DESKTOP: Phase 3 will wire this to SQLite
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
