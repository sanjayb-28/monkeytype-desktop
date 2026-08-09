import type { Mode, PersonalBests } from "@monkeytype/schemas/shared";
import type { SnapshotResult } from "../constants/default-snapshot";

const storageKey = "monkeytype.desktop.data.v1";
const maxStoredResults = 10_000;

export type DesktopData = {
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

const defaults = (): DesktopData => ({
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

export function loadDesktopData(): DesktopData {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return defaults();
    const parsed = JSON.parse(stored) as Partial<DesktopData>;
    return {
      personalBests: parsed.personalBests ?? defaults().personalBests,
      results: Array.isArray(parsed.results) ? parsed.results : [],
      typingStats: parsed.typingStats ?? defaults().typingStats,
      xp: parsed.xp ?? 0,
      streak: parsed.streak ?? 0,
      maxStreak: parsed.maxStreak ?? 0,
    };
  } catch (error) {
    console.error("Failed to load local Monkeytype data", error);
    return defaults();
  }
}

export function saveDesktopData(
  update: Partial<Omit<DesktopData, "results">> & {
    appendResult?: SnapshotResult<Mode>;
  },
): void {
  const current = loadDesktopData();
  const { appendResult, ...fields } = update;
  const next: DesktopData = { ...current, ...fields };
  if (appendResult !== undefined) {
    next.results = [...current.results, appendResult].slice(-maxStoredResults);
  }
  localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("monkeytype:desktop-data-updated"));
}
