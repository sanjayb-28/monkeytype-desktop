// Local account profile card — matches original layout minus server-only features
import { JSXElement, Show, createMemo } from "solid-js";
import { getActivePage } from "../../../signals/core";
import * as DB from "../../../db";
import { getXpDetails, formatXp } from "../../../utils/levels";
import { secondsToString } from "../../../utils/date-and-time";
import { AutoShrink } from "../../common/AutoShrink";
import { Balloon } from "../../common/Balloon";
import { Bar } from "../../common/Bar";
import { DiscordAvatar } from "../../common/DiscordAvatar";
import { LocalActivityCalendar } from "./LocalActivityCalendar";

function LevelAndBar(props: { xp: number }): JSXElement {
  const xpDetails = () => getXpDetails(props.xp);
  const bar = () => xpDetails().levelProgressPercent;

  return (
    <div class="col-span-2 flex w-full items-center gap-2">
      <Balloon
        class="shrink-0 text-text"
        text={formatXp(props.xp) + " total xp"}
      >
        {xpDetails().level}
      </Balloon>
      <Bar percent={bar()} fill="main" bg="bg" showPercentageOnHover />
      <Balloon
        class="shrink-0 text-xs"
        text={
          formatXp(xpDetails().levelMaxXp - xpDetails().levelCurrentXp) +
          " xp until next level"
        }
      >
        {formatXp(xpDetails().levelCurrentXp)}/
        {formatXp(xpDetails().levelMaxXp)}
      </Balloon>
    </div>
  );
}

function TypingStats(props: {
  typingStats: { startedTests: number; completedTests: number; timeTyping: number };
}): JSXElement {
  return (
    <>
      <div class="hidden h-full w-2 rounded bg-bg md:block"></div>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 lg:text-[1.25rem]">
        <div class="flex flex-col">
          <div class="text-em-sm text-sub">tests started</div>
          <div class="text-em-2xl leading-8">
            {props.typingStats.startedTests}
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-em-sm text-sub">tests completed</div>
          <div class="text-em-2xl leading-8">
            {props.typingStats.completedTests}
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-em-sm text-sub">time typing</div>
          <div class="text-em-2xl leading-8">
            {secondsToString(
              Math.round(props.typingStats.timeTyping ?? 0),
              true,
              true,
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function MyProfile(): JSXElement {
  const snapshot = createMemo(() =>
    getActivePage() === "account" ? DB.getSnapshot() : undefined
  );

  const formatStreak = (length: number) =>
    `${length} ${length === 1 ? "day" : "days"}`;

  return (
    <Show when={snapshot()}>
      {(snap) => (
        <div class="flex w-full flex-col gap-8">
          {/* Profile card */}
          <div class="grid grid-cols-[1fr_minmax(0,2rem)] rounded bg-sub-alt">
            <div class="grid items-center gap-4 p-4 md:grid-cols-[17.5rem_auto_1fr]">
              {/* Avatar + Name */}
              <div class="grid w-full grid-cols-[5rem_1fr] items-center gap-4 self-center text-sub">
                <DiscordAvatar
                  class="h-auto w-full place-self-center"
                  size={256}
                  discordAvatar={undefined}
                  discordId={undefined}
                />

                <div class="flex h-min flex-col gap-1 text-xs [&>div]:w-fit">
                  <AutoShrink upperLimitRem={2} class="flex text-text">
                    Monkey
                  </AutoShrink>

                  <div class="grid">
                    <span>Anonymous</span>
                    <Show when={(snap().streak ?? 0) > 1}>
                      <Balloon
                        inline
                        text={`Longest streak: ${formatStreak(snap().maxStreak ?? snap().streak ?? 0)}`}
                        position="right"
                      >
                        Current streak {formatStreak(snap().streak ?? 0)}
                      </Balloon>
                    </Show>
                  </div>
                </div>

                <LevelAndBar xp={snap().xp} />
              </div>

              {/* Typing stats */}
              <TypingStats typingStats={snap().typingStats} />
            </div>
          </div>

          {/* Activity calendar */}
          <LocalActivityCalendar />
        </div>
      )}
    </Show>
  );
}

export default MyProfile;
