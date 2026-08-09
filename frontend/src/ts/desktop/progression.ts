import { getFunbox } from "@monkeytype/funbox";
import type { CompletedEvent, XpBreakdown } from "@monkeytype/schemas/results";
import {
  getCurrentDayTimestamp,
  getStartOfDayTimestamp,
  isToday,
  isYesterday,
} from "@monkeytype/util/date-and-time";
import { mapRange } from "@monkeytype/util/numbers";

import type { DesktopData } from "./storage";

// Mirrors the v26.32.0 server XP configuration published by
// https://api.monkeytype.com/configuration for this offline release.
const xpConfiguration = {
  funboxBonus: 0.1,
  gainMultiplier: 1,
  maxDailyBonus: 1000,
  minDailyBonus: 100,
  streak: {
    maxStreakDays: 100,
    maxStreakMultiplier: 2,
  },
} as const;

export type DesktopProgression = {
  streak: number;
  xp: number;
  xpBreakdown: XpBreakdown;
};

export function calculateDesktopProgression(
  result: CompletedEvent,
  data: DesktopData,
): DesktopProgression {
  const lastResultTimestamp = data.results.reduce<number | undefined>(
    (latest, item) =>
      latest === undefined || item.timestamp > latest ? item.timestamp : latest,
    undefined,
  );
  const streak = calculateStreak(lastResultTimestamp, data.streak);

  if (result.mode === "zen") {
    return { streak, xp: 0, xpBreakdown: {} };
  }

  const breakdown: XpBreakdown = {};
  const baseXp = Math.round((result.testDuration - result.afkDuration) * 2);
  breakdown.base = baseXp;

  let modifier = 1;
  const correctedEverything = result.charStats
    .slice(1)
    .every((charStat) => charStat === 0);

  if (result.acc === 100) {
    modifier += 0.5;
    breakdown.fullAccuracy = Math.round(baseXp * 0.5);
  } else if (correctedEverything) {
    modifier += 0.25;
    breakdown.corrected = Math.round(baseXp * 0.25);
  }

  if (result.mode === "quote") {
    modifier += 0.5;
    breakdown.quote = Math.round(baseXp * 0.5);
  } else {
    if (result.punctuation) {
      modifier += 0.4;
      breakdown.punctuation = Math.round(baseXp * 0.4);
    }
    if (result.numbers) {
      modifier += 0.1;
      breakdown.numbers = Math.round(baseXp * 0.1);
    }
  }

  if (result.funbox.length > 0) {
    const funboxModifier = result.funbox.reduce(
      (sum, name) =>
        sum +
        Math.max(
          getFunbox(name).difficultyLevel * xpConfiguration.funboxBonus,
          0,
        ),
      0,
    );
    if (funboxModifier > 0) {
      modifier += funboxModifier;
      breakdown.funbox = Math.round(baseXp * funboxModifier);
    }
  }

  const streakModifier = Number.parseFloat(
    mapRange(
      streak,
      0,
      xpConfiguration.streak.maxStreakDays,
      0,
      xpConfiguration.streak.maxStreakMultiplier,
      true,
    ).toFixed(1),
  );
  if (streakModifier > 0) {
    modifier += streakModifier;
    breakdown.streak = Math.round(baseXp * streakModifier);
  }

  let incompleteXp = 0;
  if (result.incompleteTests.length > 0) {
    for (const incompleteTest of result.incompleteTests) {
      const incompleteModifier = Math.max(0, (incompleteTest.acc - 50) / 50);
      incompleteXp += Math.round(incompleteTest.seconds * incompleteModifier);
    }
    breakdown.incomplete = incompleteXp;
  } else if (result.incompleteTestSeconds > 0) {
    incompleteXp = Math.round(result.incompleteTestSeconds);
    breakdown.incomplete = incompleteXp;
  }

  let dailyBonus = 0;
  if (lastResultTimestamp !== undefined) {
    const lastResultDay = getStartOfDayTimestamp(lastResultTimestamp);
    if (lastResultDay !== getCurrentDayTimestamp()) {
      const proportionalXp = Math.round(data.xp * 0.05);
      dailyBonus = Math.max(
        Math.min(xpConfiguration.maxDailyBonus, proportionalXp),
        xpConfiguration.minDailyBonus,
      );
      breakdown.daily = dailyBonus;
    }
  }

  const xpWithModifiers = Math.round(baseXp * modifier);
  const xpAfterAccuracy = Math.round(
    xpWithModifiers * ((result.acc - 50) / 50),
  );
  breakdown.accPenalty = xpWithModifiers - xpAfterAccuracy;

  return {
    streak,
    xp:
      Math.round(
        (xpAfterAccuracy + incompleteXp) * xpConfiguration.gainMultiplier,
      ) + dailyBonus,
    xpBreakdown: breakdown,
  };
}

function calculateStreak(
  lastResultTimestamp: number | undefined,
  currentStreak: number,
): number {
  if (lastResultTimestamp === undefined) return 1;
  if (isYesterday(lastResultTimestamp)) return currentStreak + 1;
  if (!isToday(lastResultTimestamp)) return 1;
  return currentStreak;
}
