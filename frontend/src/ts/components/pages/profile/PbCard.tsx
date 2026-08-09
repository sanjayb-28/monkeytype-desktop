import { PersonalBest, PersonalBests } from "@monkeytype/schemas/shared";
import { formatDate } from "date-fns/format";
import { createMemo, For, type JSXElement, Show } from "solid-js";

import { getFormatting } from "../../../states/core";
import { showPbTablesModal } from "../../../states/pb-tables-modal";
import { Button } from "../../common/Button";

export function PbCard<M extends "time" | "words">(props: {
  mode: M;
  mode2: string[];
  pbs: PersonalBests[M];
  isAccountPage?: true;
}): JSXElement {
  const format = getFormatting;

  const bests = createMemo(() =>
    props.mode2.map((mode) => {
      const pbArray = props.pbs[mode] ?? [];

      const best = pbArray.reduce<PersonalBest | undefined>(
        (max, current) => (current.wpm > (max?.wpm ?? 0) ? current : max),
        undefined,
      );

      return {
        mode2: mode,
        pb: best,
      };
    }),
  );

  return (
    <div class="grid grid-cols-[1fr_minmax(0,2rem)] rounded bg-sub-alt">
      <div class="grid grid-cols-2 gap-8 p-4 md:grid-cols-4">
        <For each={bests()}>
          {(item) => (
            <div class="group grid items-center">
              <div
                class={
                  item.pb !== undefined
                    ? "col-start-1 row-start-1 text-center transition-opacity group-hover:opacity-0"
                    : "col-start-1 row-start-1 text-center"
                }
              >
                <div class="text-xs text-sub">
                  {item.mode2} {props.mode === "time" ? "seconds" : "words"}
                </div>
                <div class="text-4xl">
                  {format().typingSpeed(item.pb?.wpm, {
                    showDecimalPlaces: false,
                  })}
                </div>
                <div class="text-xl opacity-75">
                  {format().accuracy(item.pb?.acc, {
                    showDecimalPlaces: false,
                  })}
                </div>
              </div>

              <Show when={item.pb !== undefined}>
                <div class="col-start-1 row-start-1 grid bg-sub-alt text-center text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  <div class="text-sub">
                    {item.mode2} {props.mode === "time" ? "seconds" : "words"}
                  </div>
                  <div>
                    {format().typingSpeed(item.pb?.wpm)}{" "}
                    {format().typingSpeedUnit}
                  </div>
                  <div>{format().typingSpeed(item.pb?.raw)} raw</div>
                  <div>{format().accuracy(item.pb?.acc)} acc</div>
                  <div>{format().percentage(item.pb?.consistency)} con</div>
                  <div class="text-sub">
                    {formatDate(item.pb?.timestamp ?? 0, "dd MMM yyyy")}
                  </div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
      <Show when={props.isAccountPage}>
        <div class="flex h-full flex-col">
          <Button
            balloon={{ text: "Show all personal bests", position: "left" }}
            class="h-full rounded-none rounded-r text-sub hover:text-bg"
            fa={{ icon: "fa-ellipsis-v" }}
            onClick={() => showPbTablesModal(props.mode)}
          />
        </div>
      </Show>
    </div>
  );
}
