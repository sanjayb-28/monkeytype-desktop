import { type Config, ConfigSchema } from "@monkeytype/schemas/configs";
import { PresetSchema } from "@monkeytype/schemas/presets";
import { PersonalBestsSchema } from "@monkeytype/schemas/shared";
import {
  CustomThemeSchema,
  ResultFiltersSchema,
  UserTagSchema,
} from "@monkeytype/schemas/users";
import { z } from "zod";

import { applyConfig } from "../config/lifecycle";
import { saveFullConfigToLocalStorage } from "../config/persistence";
import { getConfig } from "../config/store";
import FileStorage, { type StoredFiles } from "../utils/file-storage";

import {
  type DesktopData,
  loadDesktopData,
  replaceDesktopData,
} from "./storage";

const DesktopResultSchema = z
  .object({
    _id: z.string().min(1),
    acc: z.number().finite().min(0).max(100),
    afkDuration: z.number().finite().nonnegative(),
    bailedOut: z.boolean(),
    blindMode: z.boolean(),
    charStats: z.tuple([
      z.number().int().nonnegative(),
      z.number().int().nonnegative(),
      z.number().int().nonnegative(),
      z.number().int().nonnegative(),
    ]),
    consistency: z.number().finite().min(0).max(100),
    dayTimestamp: z.number().finite().nonnegative(),
    difficulty: z.enum(["normal", "expert", "master"]),
    funbox: z.array(z.string()),
    incompleteTestSeconds: z.number().finite().nonnegative(),
    language: z.string().min(1),
    lazyMode: z.boolean(),
    mode: z.enum(["time", "words", "quote", "zen", "custom"]),
    mode2: z.string().min(1),
    name: z.string(),
    numbers: z.boolean(),
    punctuation: z.boolean(),
    quoteLength: z.number().int().min(-1).max(3),
    rawWpm: z.number().finite().nonnegative(),
    restartCount: z.number().int().nonnegative(),
    tags: z.array(z.string()),
    testDuration: z.number().finite().nonnegative(),
    timeTyping: z.number().finite().nonnegative(),
    timestamp: z.number().finite().nonnegative(),
    uid: z.string(),
    words: z.number().int().nonnegative(),
    wpm: z.number().finite().nonnegative(),
  })
  .passthrough();

const normalizeCollectionName = (value: unknown): unknown => {
  if (typeof value !== "object" || value === null) return value;
  const candidate = value as Record<string, unknown>;
  return {
    ...candidate,
    name:
      typeof candidate["name"] === "string"
        ? candidate["name"].replace(/ /g, "_")
        : candidate["name"],
  };
};

const DesktopPresetSchema = z
  .preprocess(normalizeCollectionName, PresetSchema)
  .transform((preset) => ({
    ...preset,
    name: preset.name.replace(/_/g, " "),
  }));

const DesktopTagSchema = z
  .preprocess(
    normalizeCollectionName,
    UserTagSchema.extend({ active: z.boolean().default(false) }),
  )
  .transform((tag) => ({
    ...tag,
    name: tag.name.replace(/_/g, " "),
  }));

const DesktopResultFilterPresetSchema = z
  .preprocess(normalizeCollectionName, ResultFiltersSchema)
  .transform((preset) => ({
    ...preset,
    name: preset.name.replace(/_/g, " "),
  }));

const DesktopDataSchema = z.object({
  customThemes: z.array(CustomThemeSchema).default([]),
  favoriteQuotes: z.record(z.string(), z.array(z.string())).default({}),
  personalBests: PersonalBestsSchema,
  presets: z.array(DesktopPresetSchema).default([]),
  resultFilterPresets: z.array(DesktopResultFilterPresetSchema).default([]),
  results: z.array(DesktopResultSchema),
  tags: z.array(DesktopTagSchema).default([]),
  typingStats: z.object({
    timeTyping: z.number().finite().nonnegative(),
    startedTests: z.number().int().nonnegative(),
    completedTests: z.number().int().nonnegative(),
  }),
  xp: z.number().finite().nonnegative(),
  streak: z.number().finite().nonnegative(),
  maxStreak: z.number().finite().nonnegative(),
});

const StoredFilesSchema = z.object({
  LocalBackgroundFile: z.string().optional(),
  LocalFontFamilyFile: z.string().optional(),
});

const DesktopBackupSchema = z.object({
  format: z.literal("monkeytype-desktop-backup"),
  version: z.union([z.literal(2), z.literal(3)]),
  exportedAt: z.string().datetime(),
  data: DesktopDataSchema,
  config: ConfigSchema,
  files: StoredFilesSchema,
});

export type DesktopBackup = {
  format: "monkeytype-desktop-backup";
  version: 3;
  exportedAt: string;
  data: DesktopData;
  config: Config;
  files: StoredFiles;
};

export async function createDesktopBackup(): Promise<string> {
  const backup: DesktopBackup = {
    format: "monkeytype-desktop-backup",
    version: 3,
    exportedAt: new Date().toISOString(),
    data: loadDesktopData(),
    config: structuredClone(getConfig),
    files: await FileStorage.getAllFiles(),
  };
  return JSON.stringify(backup, null, 2);
}

export function parseDesktopBackup(serialized: string): DesktopBackup {
  const parsed: unknown = JSON.parse(serialized);
  const current = DesktopBackupSchema.safeParse(parsed);
  if (current.success) {
    return {
      ...current.data,
      version: 3,
    } as unknown as DesktopBackup;
  }

  const legacy = DesktopDataSchema.safeParse(parsed);
  if (legacy.success) {
    return {
      format: "monkeytype-desktop-backup",
      version: 3,
      exportedAt: new Date().toISOString(),
      data: legacy.data as unknown as DesktopData,
      config: structuredClone(getConfig),
      files: {},
    };
  }

  throw new Error(
    "This is not a valid Monkeytype Desktop backup, or its version is not supported.",
  );
}

export async function restoreDesktopBackup(serialized: string): Promise<void> {
  const backup = parseDesktopBackup(serialized);
  const previousData = loadDesktopData();
  const previousConfig = structuredClone(getConfig);
  const previousFiles = await FileStorage.getAllFiles();

  try {
    await replaceDesktopData(backup.data);
    await FileStorage.replaceFiles(backup.files);
    await applyConfig(backup.config);
    saveFullConfigToLocalStorage(true);
  } catch (error) {
    await Promise.allSettled([
      replaceDesktopData(previousData),
      FileStorage.replaceFiles(previousFiles),
      applyConfig(previousConfig),
    ]);
    saveFullConfigToLocalStorage(true);
    throw error;
  }
}
