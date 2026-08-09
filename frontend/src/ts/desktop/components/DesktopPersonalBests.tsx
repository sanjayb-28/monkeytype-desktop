import { format as dateFormat } from "date-fns/format";
import { For, type JSXElement, Show } from "solid-js";

import type { PersonalBest } from "../dashboard";

import { getFormatting } from "../../states/core";

const standardSlots = {
  time: ["15", "30", "60", "120"],
  words: ["10", "25", "50", "100"],
} as const;

export function DesktopPersonalBests(props: {
  personalBests: PersonalBest[];
}): JSXElement {
  return (
    <section class="grid gap-4">
      <div>
        <div class="text-xl text-text">personal bests</div>
        <div class="text-em-xs text-sub">
          fastest standard tests stored on this Mac
        </div>
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <For each={["time", "words"] as const}>
          {(mode) => (
            <div class="desktopPbGroup grid grid-cols-4 rounded bg-sub-alt p-4">
              <For each={standardSlots[mode]}>
                {(mode2) => {
                  const pb = () =>
                    props.personalBests.find(
                      (item) => item.mode === mode && item.mode2 === mode2,
                    );
                  return (
                    <div class="desktopPbSlot group grid min-w-0 text-center">
                      <div class="col-start-1 row-start-1 transition-opacity duration-125 group-hover:opacity-0">
                        <div class="truncate text-em-xs text-sub">
                          {mode2} {mode === "time" ? "seconds" : "words"}
                        </div>
                        <div class="truncate text-3xl text-text">
                          {pb() === undefined
                            ? "–"
                            : getFormatting().typingSpeed(pb()?.wpm, {
                                showDecimalPlaces: false,
                              })}
                        </div>
                        <div class="truncate text-sm text-sub">
                          {pb() === undefined
                            ? "no result"
                            : getFormatting().accuracy(pb()?.acc, {
                                showDecimalPlaces: false,
                              })}
                        </div>
                      </div>
                      <div class="col-start-1 row-start-1 grid content-center bg-sub-alt text-em-xs opacity-0 transition-opacity duration-125 group-hover:opacity-100">
                        <Show
                          when={pb()}
                          fallback={<span class="text-sub">no result</span>}
                        >
                          {(best) => (
                            <>
                              <span>
                                {getFormatting().typingSpeed(best().wpm)} wpm
                              </span>
                              <span>
                                {getFormatting().typingSpeed(best().rawWpm)} raw
                              </span>
                              <span>
                                {getFormatting().accuracy(best().acc)} acc
                              </span>
                              <span class="text-sub">
                                {dateFormat(best().timestamp, "dd MMM yyyy")}
                              </span>
                            </>
                          )}
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
