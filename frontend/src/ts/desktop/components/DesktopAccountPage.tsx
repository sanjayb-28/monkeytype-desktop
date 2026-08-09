import type { Mode } from "@monkeytype/schemas/shared";

import {
  createMemo,
  createSignal,
  For,
  type JSXElement,
  onCleanup,
  Show,
} from "solid-js";

import { Button } from "../../components/common/Button";
import { H2 } from "../../components/common/Headers";
import { Page } from "../../components/common/Page";
import { getConfig } from "../../config/store";
import { showNoticeNotification } from "../../states/notifications";
import {
  buildActivityCalendar,
  calculateDashboardStats,
  dashboardRanges,
  type DashboardFilters,
  type DashboardSort,
  defaultDashboardFilters,
  filterDashboardResults,
  getPersonalBests,
  resultsToCsv,
  sortDashboardResults,
} from "../dashboard";
import { loadDesktopData } from "../storage";
import { DesktopActivityCalendar } from "./DesktopActivityCalendar";
import { DesktopDashboardCharts } from "./DesktopDashboardCharts";
import { DesktopPersonalBests } from "./DesktopPersonalBests";
import { DesktopResultsTable } from "./DesktopResultsTable";

const modes: ("all" | Mode)[] = [
  "all",
  "time",
  "words",
  "quote",
  "zen",
  "custom",
];

const rangeLabels = {
  all: "all time",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "1y": "1 year",
} as const;

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

function downloadLocalFile(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.download = name;
  anchor.href = url;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DesktopAccountPage(): JSXElement {
  const [data, setData] = createSignal(loadDesktopData());
  const [filters, setFilters] = createSignal(defaultDashboardFilters());
  const [showAdvancedFilters, setShowAdvancedFilters] = createSignal(false);
  const [sorting, setSorting] = createSignal<DashboardSort>({
    direction: "desc",
    field: "timestamp",
  });
  const [visibleResults, setVisibleResults] = createSignal(25);
  const [expandedResultId, setExpandedResultId] = createSignal<string | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = createSignal(
    new Date().getFullYear(),
  );

  const refresh = (): void => {
    setData(loadDesktopData());
  };
  window.addEventListener("monkeytype:desktop-data-updated", refresh);
  onCleanup(() =>
    window.removeEventListener("monkeytype:desktop-data-updated", refresh),
  );

  const allResults = createMemo(() =>
    [...data().results].sort((left, right) => right.timestamp - left.timestamp),
  );
  const filteredResults = createMemo(() =>
    filterDashboardResults(allResults(), filters()),
  );
  const tableResults = createMemo(() =>
    sortDashboardResults(filteredResults(), sorting()),
  );
  const lifetimeStats = createMemo(() => calculateDashboardStats(allResults()));
  const filteredStats = createMemo(() =>
    calculateDashboardStats(filteredResults()),
  );
  const languages = createMemo(() => [
    "all",
    ...new Set(allResults().map((result) => result.language)),
  ]);
  const years = createMemo(() => {
    const resultYears = allResults().map((result) =>
      new Date(result.timestamp).getFullYear(),
    );
    return [...new Set([new Date().getFullYear(), ...resultYears])].sort(
      (left, right) => right - left,
    );
  });
  const calendar = createMemo(() =>
    buildActivityCalendar(allResults(), selectedYear()),
  );
  const personalBests = createMemo(() => getPersonalBests(allResults()));

  const updateFilters = (update: Partial<DashboardFilters>): void => {
    setFilters((current) => ({ ...current, ...update }));
    setVisibleResults(25);
    setExpandedResultId(null);
  };

  const useCurrentSettings = (): void => {
    updateFilters({
      ...defaultDashboardFilters(),
      language: getConfig.language,
      mode: getConfig.mode,
      numbers: getConfig.numbers,
      punctuation: getConfig.punctuation,
    });
  };

  const selectChartResult = (event: { _id: string; index: number }): void => {
    setSorting({ direction: "desc", field: "timestamp" });
    setVisibleResults(Math.max(visibleResults(), event.index + 1));
    setExpandedResultId(event._id);
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-result-id="${event._id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <Page id="account">
      <div class="desktopDashboard flex flex-col gap-12">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <H2
              class="pb-1"
              fa={{ icon: "fa-chart-line" }}
              text="local dashboard"
            />
            <div class="text-sub">
              your complete typing history, stored only on this Mac
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              fa={{ icon: "fa-file-csv" }}
              text="export CSV"
              disabled={allResults().length === 0}
              onClick={() => {
                downloadLocalFile(
                  "monkeytype-results.csv",
                  resultsToCsv(allResults()),
                  "text/csv;charset=utf-8",
                );
                showNoticeNotification("Local results exported");
              }}
            />
            <Button
              fa={{ icon: "fa-download" }}
              text="backup JSON"
              onClick={() => {
                downloadLocalFile(
                  "monkeytype-desktop-backup.json",
                  JSON.stringify(data(), null, 2),
                  "application/json",
                );
                showNoticeNotification("Local backup exported");
              }}
            />
          </div>
        </div>

        <section class="desktopLifetimeStats grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          <LifetimeStat
            label="tests completed"
            value={formatNumber(data().typingStats.completedTests)}
          />
          <LifetimeStat
            label="time typing"
            value={formatDuration(data().typingStats.timeTyping)}
          />
          <LifetimeStat
            label="completion rate"
            value={`${Math.round(
              (data().typingStats.completedTests /
                Math.max(1, data().typingStats.startedTests)) *
                100,
            )}%`}
          />
          <LifetimeStat
            label="highest wpm"
            value={Math.round(lifetimeStats().bestWpm)}
          />
          <LifetimeStat
            label="estimated words"
            value={formatNumber(lifetimeStats().estimatedWords)}
          />
        </section>

        <DesktopPersonalBests personalBests={personalBests()} />

        <DesktopActivityCalendar
          days={calendar()}
          onYearChange={setSelectedYear}
          selectedYear={selectedYear()}
          years={years()}
        />

        <section class="desktopDashboardFilters grid gap-5 rounded bg-sub-alt p-5">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="text-xl text-text">filters</div>
              <div class="text-em-xs text-sub">
                showing {filteredResults().length} of {allResults().length}{" "}
                tests
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                text="all"
                onClick={() => updateFilters(defaultDashboardFilters())}
              />
              <Button text="current settings" onClick={useCurrentSettings} />
              <Button
                text="advanced"
                active={showAdvancedFilters()}
                onClick={() => setShowAdvancedFilters((current) => !current)}
              />
              <Button
                fa={{ icon: "fa-crown" }}
                text="personal bests"
                active={filters().pbOnly}
                onClick={() => updateFilters({ pbOnly: !filters().pbOnly })}
              />
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-[1.15fr_1fr_auto]">
            <FilterGroup label="date range">
              <For each={dashboardRanges}>
                {(range) => (
                  <Button
                    text={rangeLabels[range]}
                    active={filters().range === range}
                    onClick={() => updateFilters({ range })}
                  />
                )}
              </For>
            </FilterGroup>

            <FilterGroup label="mode">
              <For each={modes}>
                {(mode) => (
                  <Button
                    text={mode}
                    active={filters().mode === mode}
                    onClick={() => updateFilters({ mode })}
                  />
                )}
              </For>
            </FilterGroup>

            <label class="grid content-start gap-2 text-em-sm text-sub">
              language
              <select
                class="rounded border-0 bg-bg px-3 py-2 text-text outline-none focus-visible:ring-2 focus-visible:ring-main"
                value={filters().language}
                onChange={(event) =>
                  updateFilters({ language: event.currentTarget.value })
                }
              >
                <For each={languages()}>
                  {(language) => (
                    <option value={language}>
                      {language.replaceAll("_", " ")}
                    </option>
                  )}
                </For>
              </select>
            </label>
          </div>

          <Show when={showAdvancedFilters()}>
            <div class="grid gap-5 border-t border-sub pt-5 sm:grid-cols-2">
              <TriStateFilter
                label="punctuation"
                value={filters().punctuation}
                onChange={(punctuation) => updateFilters({ punctuation })}
              />
              <TriStateFilter
                label="numbers"
                value={filters().numbers}
                onChange={(numbers) => updateFilters({ numbers })}
              />
            </div>
          </Show>
        </section>

        <Show
          when={filteredResults().length > 0}
          fallback={
            <div class="grid min-h-60 place-items-center text-center text-sub">
              <div>
                <div class="mb-2 text-2xl text-text">no matching tests</div>
                <div>Adjust the filters or complete another typing test.</div>
              </div>
            </div>
          }
        >
          <DesktopDashboardCharts
            results={filteredResults()}
            onResultSelect={selectChartResult}
          />

          <section class="grid gap-5">
            <div>
              <div class="text-xl text-text">selected test statistics</div>
              <div class="text-em-xs text-sub">
                aggregates for the active dashboard filters
              </div>
            </div>
            <div class="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
              <Metric
                label="tests completed"
                value={filteredStats().completed}
              />
              <Metric
                label="time typing"
                value={formatDuration(filteredStats().timeTyping)}
              />
              <Metric
                label="highest wpm"
                value={Math.round(filteredStats().bestWpm)}
              />
              <Metric
                label="average wpm"
                value={Math.round(filteredStats().averageWpm)}
              />
              <Metric
                label="average wpm (last 10)"
                value={Math.round(filteredStats().lastTenWpm)}
              />
              <Metric
                label="highest accuracy"
                value={`${filteredStats().bestAccuracy.toFixed(1)}%`}
              />
              <Metric
                label="average accuracy"
                value={`${filteredStats().averageAccuracy.toFixed(1)}%`}
              />
              <Metric
                label="average consistency"
                value={`${filteredStats().averageConsistency.toFixed(1)}%`}
              />
            </div>
          </section>

          <section class="grid gap-5">
            <div>
              <div class="text-xl text-text">result history</div>
              <div class="text-em-xs text-sub">
                select a row to inspect its settings and speed trace
              </div>
            </div>
            <DesktopResultsTable
              expandedResultId={expandedResultId()}
              hasMore={tableResults().length > visibleResults()}
              onExpandedResultChange={setExpandedResultId}
              onLoadMore={() => setVisibleResults((current) => current + 25)}
              onSortingChange={setSorting}
              results={tableResults().slice(0, visibleResults())}
              sorting={sorting()}
            />
          </section>
        </Show>
      </div>
    </Page>
  );
}

function LifetimeStat(props: {
  label: string;
  value: number | string;
}): JSXElement {
  return (
    <div class="px-4 first:pl-0">
      <div class="text-3xl text-main lg:text-4xl">{props.value}</div>
      <div class="text-em-xs text-sub">{props.label}</div>
    </div>
  );
}

function Metric(props: { label: string; value: number | string }): JSXElement {
  return (
    <div>
      <div class="text-sub">{props.label}</div>
      <div class="text-2xl leading-tight text-text lg:text-4xl">
        {props.value}
      </div>
    </div>
  );
}

function FilterGroup(props: {
  children: JSXElement;
  label: string;
}): JSXElement {
  return (
    <div class="grid content-start gap-2">
      <div class="text-em-sm text-sub">{props.label}</div>
      <div class="flex flex-wrap gap-2">{props.children}</div>
    </div>
  );
}

function TriStateFilter(props: {
  label: string;
  onChange: (value: boolean | null) => void;
  value: boolean | null;
}): JSXElement {
  return (
    <FilterGroup label={props.label}>
      <Button
        text="all"
        active={props.value === null}
        onClick={() => props.onChange(null)}
      />
      <Button
        text="off"
        active={props.value === false}
        onClick={() => props.onChange(false)}
      />
      <Button
        text="on"
        active={props.value === true}
        onClick={() => props.onChange(true)}
      />
    </FilterGroup>
  );
}
