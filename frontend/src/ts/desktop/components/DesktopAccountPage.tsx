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
import { Fa } from "../../components/common/Fa";
import { Page } from "../../components/common/Page";
import { getConfig } from "../../config/store";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { showSimpleModal } from "../../states/simple-modal";
import {
  createDesktopBackup,
  parseDesktopBackup,
  restoreDesktopBackup,
} from "../backup";
import {
  buildActivityCalendar,
  calculateDashboardStats,
  dashboardRanges,
  type DashboardFilters,
  type DashboardSort,
  defaultDashboardFilters,
  filterDashboardResults,
  getStoredPersonalBests,
  resultsToCsv,
  sortDashboardResults,
} from "../dashboard";
import { openTextFile, saveTextFile } from "../native-files";
import {
  clearDesktopData,
  deleteDesktopResult,
  loadDesktopData,
} from "../storage";
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

const formatClockDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

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
  const personalBests = createMemo(() =>
    getStoredPersonalBests(data().personalBests),
  );

  const exportCsv = async (): Promise<void> => {
    try {
      const saved = await saveTextFile(
        "monkeytype-results.csv",
        resultsToCsv(allResults()),
        "text/csv;charset=utf-8",
      );
      if (saved) showSuccessNotification("Local results exported");
    } catch (error) {
      showErrorNotification("Failed to export local results", { error });
    }
  };

  const exportBackup = async (): Promise<void> => {
    try {
      const saved = await saveTextFile(
        "monkeytype-desktop-backup.json",
        await createDesktopBackup(),
        "application/json",
      );
      if (saved) showSuccessNotification("Local backup exported");
    } catch (error) {
      showErrorNotification("Failed to export local backup", { error });
    }
  };

  const chooseBackup = async (): Promise<void> => {
    try {
      const serialized = await openTextFile();
      if (serialized === null) return;
      parseDesktopBackup(serialized);
      showSimpleModal({
        title: "restore local backup",
        text: "This replaces the current history, personal bests, settings, local font, and local background. Export a backup first if you need the current data.",
        buttonText: "restore",
        execFn: async () => {
          await restoreDesktopBackup(serialized);
          return {
            status: "success",
            message: "Backup restored",
            afterHide: () => window.location.reload(),
          };
        },
      });
    } catch (error) {
      showErrorNotification("Failed to read local backup", { error });
    }
  };

  const confirmClearHistory = (): void => {
    showSimpleModal({
      title: "clear local typing data",
      text: "This permanently removes every result, personal best, and typing statistic from this Mac. Settings and custom appearance files stay unchanged.",
      buttonText: "clear",
      execFn: async () => {
        await clearDesktopData();
        return {
          status: "success",
          message: "Local typing data cleared",
          afterHide: () => window.location.reload(),
        };
      },
    });
  };

  const confirmDeleteResult = (resultId: string): void => {
    showSimpleModal({
      title: "delete local result",
      text: "This permanently removes this result and recalculates local personal bests and typing statistics.",
      buttonText: "delete",
      execFn: async () => {
        await deleteDesktopResult(resultId);
        return {
          status: "success",
          message: "Local result deleted",
        };
      },
    });
  };

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
      <div class="desktopDashboard flex flex-col gap-8">
        <section class="desktopProfileSummary grid overflow-hidden rounded bg-sub-alt md:grid-cols-[21rem_1fr_auto]">
          <div class="flex items-center gap-4 p-4">
            <div class="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-bg text-5xl text-sub">
              <Fa icon="fa-user" />
            </div>
            <div class="min-w-0">
              <div class="truncate text-2xl text-text">local profile</div>
              <div class="text-em-xs text-sub">offline • this Mac</div>
            </div>
          </div>

          <div class="desktopLifetimeStats grid grid-cols-3 items-center p-4">
            <LifetimeStat
              label="tests started"
              value={formatNumber(data().typingStats.startedTests)}
            />
            <LifetimeStat
              label="tests completed"
              value={formatNumber(data().typingStats.completedTests)}
            />
            <LifetimeStat
              label="time typing"
              value={formatClockDuration(data().typingStats.timeTyping)}
            />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-1">
            <Button
              fa={{ icon: "fa-download", fixedWidth: true }}
              balloon={{ text: "Export local backup", position: "left" }}
              class="h-full rounded-none text-sub hover:text-bg"
              onClick={() => void exportBackup()}
            />
            <Button
              fa={{ icon: "fa-upload", fixedWidth: true }}
              balloon={{ text: "Restore local backup", position: "left" }}
              class="h-full rounded-none text-sub hover:text-bg"
              onClick={() => void chooseBackup()}
            />
          </div>
        </section>

        <section class="desktopLocalLifetime grid items-center gap-4 rounded bg-sub-alt p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="text-center text-sub">local lifetime</div>
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
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div class="text-xl text-text">result history</div>
                <div class="text-em-xs text-sub">
                  select a row to inspect its settings and speed trace
                </div>
              </div>
              <Button
                fa={{ icon: "fa-file-csv" }}
                text="export CSV"
                disabled={allResults().length === 0}
                onClick={() => void exportCsv()}
              />
            </div>
            <DesktopResultsTable
              expandedResultId={expandedResultId()}
              hasMore={tableResults().length > visibleResults()}
              onExpandedResultChange={setExpandedResultId}
              onLoadMore={() => setVisibleResults((current) => current + 25)}
              onDeleteResult={confirmDeleteResult}
              onSortingChange={setSorting}
              results={tableResults().slice(0, visibleResults())}
              sorting={sorting()}
            />
          </section>
        </Show>

        <section class="grid gap-3 border-t border-sub pt-8">
          <div>
            <div class="text-xl text-text">local data</div>
            <div class="text-em-xs text-sub">
              Back up your data before clearing it. Deleted history cannot be
              recovered.
            </div>
          </div>
          <Button
            fa={{ icon: "fa-trash" }}
            text="clear typing data"
            disabled={allResults().length === 0}
            class="justify-self-start"
            onClick={confirmClearHistory}
          />
        </section>
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
