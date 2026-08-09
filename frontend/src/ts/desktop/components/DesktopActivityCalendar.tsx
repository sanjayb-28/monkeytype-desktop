import { For, type JSXElement } from "solid-js";

import type { CalendarDay } from "../dashboard";

import { Button } from "../../components/common/Button";

const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  return minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export function DesktopActivityCalendar(props: {
  days: CalendarDay[];
  onYearChange: (year: number) => void;
  selectedYear: number;
  years: number[];
}): JSXElement {
  return (
    <section class="desktopActivityCalendar grid gap-4">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div class="text-xl text-text">activity</div>
          <div class="text-em-xs text-sub">
            completed tests by local calendar day
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <For each={props.years}>
            {(year) => (
              <Button
                text={String(year)}
                active={year === props.selectedYear}
                onClick={() => props.onYearChange(year)}
              />
            )}
          </For>
        </div>
      </div>

      <div class="overflow-x-auto pb-2">
        <div class="activityGrid" aria-label={`${props.selectedYear} activity`}>
          <For each={props.days}>
            {(day) => (
              <div
                class="activityDay"
                data-level={day.level}
                data-outside={
                  day.date.getFullYear() === props.selectedYear
                    ? undefined
                    : "true"
                }
                aria-label={`${day.date.toLocaleDateString()}: ${day.count} tests, ${formatDuration(day.timeTyping)}`}
                data-balloon-pos="up"
              ></div>
            )}
          </For>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 text-em-xs text-sub">
        <span>less</span>
        <For each={[0, 1, 2, 3, 4]}>
          {(level) => <div class="activityLegend" data-level={level}></div>}
        </For>
        <span>more</span>
      </div>
    </section>
  );
}
