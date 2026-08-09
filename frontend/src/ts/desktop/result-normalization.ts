import type { ResultMinified } from "@monkeytype/schemas/results";
import type { Mode } from "@monkeytype/schemas/shared";

import type { SnapshotResult } from "../constants/default-snapshot";

export type DesktopResultInput = Omit<
  SnapshotResult<Mode>,
  "dayTimestamp" | "name" | "timeTyping" | "words"
> &
  Partial<
    Pick<SnapshotResult<Mode>, "dayTimestamp" | "name" | "timeTyping" | "words">
  >;

const startOfLocalDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const calculateTimeTyping = (
  result: ResultMinified | DesktopResultInput | SnapshotResult<Mode>,
): number => {
  let timeTyping = 0;
  if (
    result.testDuration === undefined &&
    result.mode2 !== "custom" &&
    result.mode2 !== "zen"
  ) {
    timeTyping =
      result.mode === "time"
        ? Number.parseInt(result.mode2)
        : (Number.parseInt(result.mode2) / result.wpm) * 60;
  } else {
    timeTyping = Number.parseFloat(String(result.testDuration));
  }

  if (result.incompleteTestSeconds !== undefined) {
    timeTyping += result.incompleteTestSeconds;
  } else if (result.restartCount !== undefined && result.restartCount > 0) {
    timeTyping += (timeTyping / 4) * result.restartCount;
  }
  return Number.isFinite(timeTyping) ? timeTyping : 0;
};

export function normalizeResult(
  input: ResultMinified | DesktopResultInput | SnapshotResult<Mode>,
  knownTagIds?: Set<string>,
): SnapshotResult<Mode> {
  const result = structuredClone(input);

  result.bailedOut ??= false;
  result.blindMode ??= false;
  result.lazyMode ??= false;
  result.difficulty ??= "normal";
  result.funbox ??= [];
  result.language ??= "english";
  result.numbers ??= false;
  result.punctuation ??= false;
  result.quoteLength ??= -1;
  result.restartCount ??= 0;
  result.incompleteTestSeconds ??= 0;
  result.afkDuration ??= 0;
  result.tags ??= [];
  result.isPb ??= false;

  if (knownTagIds !== undefined) {
    result.tags = result.tags.filter((tagId) => knownTagIds.has(tagId));
  }

  return {
    ...result,
    name: "name" in result && result.name !== undefined ? result.name : "local",
    stopOnLetter:
      "stopOnLetter" in result ? (result.stopOnLetter ?? false) : false,
    timeTyping: calculateTimeTyping(result),
    words: Math.round((result.wpm / 60) * result.testDuration),
    dayTimestamp: startOfLocalDay(result.timestamp),
  } as SnapshotResult<Mode>;
}
