import type { Mode } from "@monkeytype/schemas/shared";

import { format as dateFormat } from "date-fns/format";
import { For, Show, type JSXElement } from "solid-js";

import type { SnapshotResult } from "../../constants/default-snapshot";
import type { DashboardSort } from "../dashboard";

import { Button } from "../../components/common/Button";
import { Fa } from "../../components/common/Fa";
import { getFormatting } from "../../states/core";

const sparklinePoints = (values: number[]): string => {
  if (values.length === 0) return "";
  const maximum = Math.max(1, ...values);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 32 - (value / maximum) * 28;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const headerLabel = (
  label: string,
  field: DashboardSort["field"],
  sorting: DashboardSort,
): string =>
  `${label}${sorting.field === field ? (sorting.direction === "desc" ? " ↓" : " ↑") : ""}`;

export function DesktopResultsTable(props: {
  expandedResultId: string | null;
  hasMore: boolean;
  onExpandedResultChange: (id: string | null) => void;
  onDeleteResult: (id: string) => void;
  onLoadMore: () => void;
  onSortingChange: (sorting: DashboardSort) => void;
  results: SnapshotResult<Mode>[];
  sorting: DashboardSort;
}): JSXElement {
  const changeSorting = (field: DashboardSort["field"]): void => {
    props.onSortingChange({
      direction:
        props.sorting.field === field && props.sorting.direction === "desc"
          ? "asc"
          : "desc",
      field,
    });
  };

  return (
    <div class="grid gap-4">
      <div class="overflow-x-auto">
        <table class="desktopResultsTable w-full table-auto text-left text-sm">
          <thead class="text-sub">
            <tr>
              <th class="w-8">
                <span class="sr-only">personal best</span>
              </th>
              <th>
                <Button
                  variant="text"
                  text={headerLabel("wpm", "wpm", props.sorting)}
                  onClick={() => changeSorting("wpm")}
                />
              </th>
              <th class="hidden sm:table-cell">raw</th>
              <th class="hidden xs:table-cell">
                <Button
                  variant="text"
                  text={headerLabel("accuracy", "acc", props.sorting)}
                  onClick={() => changeSorting("acc")}
                />
              </th>
              <th class="hidden md:table-cell">
                <Button
                  variant="text"
                  text={headerLabel(
                    "consistency",
                    "consistency",
                    props.sorting,
                  )}
                  onClick={() => changeSorting("consistency")}
                />
              </th>
              <th>test</th>
              <th class="hidden lg:table-cell">language</th>
              <th class="text-right">
                <Button
                  variant="text"
                  text={headerLabel("date", "timestamp", props.sorting)}
                  onClick={() => changeSorting("timestamp")}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={props.results}>
              {(result) => {
                const expanded = () => props.expandedResultId === result._id;
                const chart = () =>
                  result.chartData === "toolong" ? undefined : result.chartData;
                return (
                  <>
                    <tr
                      class="resultRow cursor-pointer"
                      data-result-id={result._id}
                      data-expanded={expanded() ? "true" : undefined}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded()}
                      aria-controls={`result-details-${result._id}`}
                      onClick={() =>
                        props.onExpandedResultChange(
                          expanded() ? null : result._id,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        props.onExpandedResultChange(
                          expanded() ? null : result._id,
                        );
                      }}
                    >
                      <td class="text-main">
                        <Show when={result.isPb === true}>
                          <Fa icon="fa-crown" fixedWidth />
                        </Show>
                      </td>
                      <td class="text-lg text-text">
                        {getFormatting().typingSpeed(result.wpm, {
                          showDecimalPlaces: true,
                        })}
                      </td>
                      <td class="hidden text-sub sm:table-cell">
                        {getFormatting().typingSpeed(result.rawWpm, {
                          showDecimalPlaces: true,
                        })}
                      </td>
                      <td class="hidden xs:table-cell">
                        {getFormatting().accuracy(result.acc, {
                          showDecimalPlaces: true,
                        })}
                      </td>
                      <td class="hidden md:table-cell">
                        {getFormatting().percentage(result.consistency, {
                          showDecimalPlaces: true,
                        })}
                      </td>
                      <td>
                        {result.mode} {result.mode2}
                        <span class="ml-2 text-sub">
                          {result.punctuation ? "@" : ""}
                          {result.numbers ? "#" : ""}
                        </span>
                      </td>
                      <td class="hidden text-sub lg:table-cell">
                        {result.language.replaceAll("_", " ")}
                      </td>
                      <td class="text-right whitespace-nowrap">
                        <div>{dateFormat(result.timestamp, "dd MMM yyyy")}</div>
                        <div class="text-em-xs text-sub">
                          {dateFormat(result.timestamp, "HH:mm")}
                        </div>
                      </td>
                    </tr>
                    <Show when={expanded()}>
                      <tr
                        class="resultDetails"
                        id={`result-details-${result._id}`}
                      >
                        <td colSpan={8}>
                          <div class="grid gap-6 py-5 md:grid-cols-[1fr_2fr]">
                            <div class="grid grid-cols-2 content-start gap-x-6 gap-y-3 text-em-sm">
                              <Detail
                                label="duration"
                                value={`${result.testDuration.toFixed(1)}s`}
                              />
                              <Detail
                                label="characters"
                                value={result.charStats.join("/")}
                              />
                              <Detail
                                label="difficulty"
                                value={result.difficulty}
                              />
                              <Detail
                                label="restarts"
                                value={String(result.restartCount)}
                              />
                              <Detail
                                label="funbox"
                                value={
                                  result.funbox.length === 0
                                    ? "none"
                                    : result.funbox
                                        .join(", ")
                                        .replaceAll("_", " ")
                                }
                              />
                              <Detail
                                label="personal best"
                                value={result.isPb === true ? "yes" : "no"}
                              />
                              <Button
                                danger
                                fa={{ icon: "fa-trash" }}
                                text="delete result"
                                class="col-span-2 mt-2"
                                onClick={() => props.onDeleteResult(result._id)}
                              />
                            </div>
                            <Show
                              when={chart()}
                              fallback={
                                <div class="grid place-items-center text-sub">
                                  graph unavailable for this test
                                </div>
                              }
                            >
                              {(chartData) => (
                                <div class="grid gap-2">
                                  <div class="text-em-xs text-sub">
                                    test speed trace
                                  </div>
                                  <svg
                                    class="h-24 w-full overflow-visible"
                                    viewBox="0 0 100 36"
                                    preserveAspectRatio="none"
                                    role="img"
                                    aria-label="Test speed trace"
                                  >
                                    <polyline
                                      points={sparklinePoints(chartData().wpm)}
                                      fill="none"
                                      stroke="var(--main-color)"
                                      style={{
                                        "stroke-width": "1.25",
                                        "vector-effect": "non-scaling-stroke",
                                      }}
                                    ></polyline>
                                  </svg>
                                </div>
                              )}
                            </Show>
                          </div>
                        </td>
                      </tr>
                    </Show>
                  </>
                );
              }}
            </For>
          </tbody>
        </table>
      </div>
      <Show when={props.hasMore}>
        <Button text="load more" class="w-full" onClick={props.onLoadMore} />
      </Show>
    </div>
  );
}

function Detail(props: { label: string; value: string }): JSXElement {
  return (
    <div>
      <div class="text-sub">{props.label}</div>
      <div class="truncate text-text">{props.value}</div>
    </div>
  );
}
