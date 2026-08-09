import { format as dateFormat } from "date-fns/format";
import { createMemo, type JSXElement } from "solid-js";

import type { SnapshotResult } from "../../constants/default-snapshot";

import { ChartJs } from "../../components/common/ChartJs";
import { HistogramChart } from "../../components/pages/account/HistogramChart";
import { HistoryChart } from "../../components/pages/account/HistoryChart";
import { getConfig } from "../../config/store";
import { getFormatting } from "../../states/core";
import { getTheme } from "../../states/theme";
import { get as getTypingSpeedUnit } from "../../utils/typing-speed-units";
import { groupDailyActivity } from "../dashboard";

export function DesktopDashboardCharts(props: {
  onResultSelect: (event: { _id: string; index: number }) => void;
  results: SnapshotResult<"time" | "words" | "quote" | "zen" | "custom">[];
}): JSXElement {
  const typingSpeedUnit = createMemo(() =>
    getTypingSpeedUnit(getConfig.typingSpeedUnit),
  );
  const daily = createMemo(() => groupDailyActivity(props.results));

  return (
    <div class="grid gap-12">
      <section>
        <div class="mb-3 flex items-end justify-between gap-4">
          <div>
            <div class="text-xl text-text">performance history</div>
            <div class="text-em-xs text-sub">
              speed, accuracy, moving averages, and personal-best progression
            </div>
          </div>
          <div class="text-em-xs text-sub">{props.results.length} tests</div>
        </div>
        <HistoryChart
          results={props.results}
          beginAtZero={getConfig.startGraphsAtZero}
          typingSpeedUnit={typingSpeedUnit()}
          format={getFormatting()}
          onClick={props.onResultSelect}
        />
      </section>

      <div class="grid gap-10 lg:grid-cols-2">
        <section>
          <div class="mb-3">
            <div class="text-xl text-text">speed distribution</div>
            <div class="text-em-xs text-sub">
              completed tests grouped by {getFormatting().typingSpeedUnit}
            </div>
          </div>
          <HistogramChart
            results={props.results}
            typingSpeedUnit={typingSpeedUnit()}
          />
        </section>

        <section>
          <div class="mb-3">
            <div class="text-xl text-text">daily activity</div>
            <div class="text-em-xs text-sub">
              minutes practiced with average speed
            </div>
          </div>
          <div class="h-50">
            <ChartJs
              name="DesktopDailyActivity"
              type="bar"
              data={{
                labels: daily().map((day) =>
                  dateFormat(day.dayTimestamp, "MMM d"),
                ),
                datasets: [
                  {
                    yAxisID: "minutes",
                    label: "minutes",
                    data: daily().map((day) => day.timeTyping / 60),
                    backgroundColor: getTheme().main,
                    borderColor: getTheme().main,
                    order: 2,
                  },
                  {
                    yAxisID: "speed",
                    label: getFormatting().typingSpeedUnit,
                    data: daily().map((day) =>
                      typingSpeedUnit().fromWpm(day.averageWpm),
                    ),
                    borderColor: getTheme().sub,
                    pointBackgroundColor: getTheme().sub,
                    type: "line",
                    tension: 0.25,
                    order: 1,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                interaction: { intersect: false, mode: "index" },
                scales: {
                  x: { grid: { display: false } },
                  minutes: {
                    beginAtZero: true,
                    position: "left",
                    title: { display: true, text: "minutes" },
                  },
                  speed: {
                    beginAtZero: getConfig.startGraphsAtZero,
                    grid: { display: false },
                    position: "right",
                    title: {
                      display: true,
                      text: getFormatting().typingSpeedUnit,
                    },
                  },
                },
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
