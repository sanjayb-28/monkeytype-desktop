import { getFunbox } from "@monkeytype/funbox";
import type { CompletedEvent } from "@monkeytype/schemas/results";

type PersonalBestCandidate = Pick<
  CompletedEvent,
  "acc" | "bailedOut" | "funbox" | "mode" | "wpm"
> & { stopOnLetter?: boolean };

export type DesktopPersonalBestDecision = {
  isPersonalBest: boolean;
  shouldCelebrate: boolean;
};

export function getDesktopPersonalBestDecision(
  result: PersonalBestCandidate,
  previousWpm: number | undefined,
): DesktopPersonalBestDecision {
  const eligible =
    result.mode !== "quote" &&
    !result.bailedOut &&
    (!result.stopOnLetter || result.acc === 100) &&
    getFunbox(result.funbox).every((funbox) => funbox.canGetPb);
  const isPersonalBest =
    eligible && (previousWpm === undefined || result.wpm > previousWpm);

  return {
    isPersonalBest,
    // Web Monkeytype celebrates an improvement, but not the first recorded PB.
    shouldCelebrate: isPersonalBest && previousWpm !== undefined,
  };
}
