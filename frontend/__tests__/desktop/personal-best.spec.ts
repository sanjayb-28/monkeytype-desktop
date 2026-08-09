import { describe, expect, it } from "vitest";

import { getDesktopPersonalBestDecision } from "../../src/ts/desktop/personal-best";

const candidate: Parameters<typeof getDesktopPersonalBestDecision>[0] = {
  acc: 100,
  bailedOut: false,
  funbox: [],
  mode: "words" as const,
  stopOnLetter: false,
  wpm: 80,
};

describe("desktop personal best decisions", () => {
  it("records but does not celebrate the first PB", () => {
    expect(getDesktopPersonalBestDecision(candidate, undefined)).toEqual({
      isPersonalBest: true,
      shouldCelebrate: false,
    });
  });

  it("celebrates an improvement over an existing PB", () => {
    expect(getDesktopPersonalBestDecision(candidate, 70)).toEqual({
      isPersonalBest: true,
      shouldCelebrate: true,
    });
  });

  it("does not mark an equal or slower result as a PB", () => {
    expect(getDesktopPersonalBestDecision(candidate, 80)).toEqual({
      isPersonalBest: false,
      shouldCelebrate: false,
    });
  });

  it("rejects quote, bailed, inaccurate stop-on-letter, and ineligible funbox results", () => {
    expect(
      getDesktopPersonalBestDecision({ ...candidate, mode: "quote" }, 70),
    ).toMatchObject({ isPersonalBest: false });
    expect(
      getDesktopPersonalBestDecision({ ...candidate, bailedOut: true }, 70),
    ).toMatchObject({ isPersonalBest: false });
    expect(
      getDesktopPersonalBestDecision(
        { ...candidate, stopOnLetter: true, acc: 99 },
        70,
      ),
    ).toMatchObject({ isPersonalBest: false });
    expect(
      getDesktopPersonalBestDecision({ ...candidate, funbox: ["58008"] }, 70),
    ).toMatchObject({ isPersonalBest: false });
  });
});
