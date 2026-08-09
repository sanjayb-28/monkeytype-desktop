import type { Mode } from "@monkeytype/schemas/shared";

import {
  createEffect,
  createMemo,
  createSignal,
  type JSXElement,
  onCleanup,
  Show,
} from "solid-js";

import type { SnapshotResult } from "../../constants/default-snapshot";

import {
  createResultsQueryState,
  refreshDesktopResults,
  useResultsLiveQuery,
} from "../../collections/results";
import AsyncContent from "../../components/common/AsyncContent";
import { Button } from "../../components/common/Button";
import { Page } from "../../components/common/Page";
import { Charts } from "../../components/pages/account/Charts";
import { Filters } from "../../components/pages/account/Filters";
import { Table } from "../../components/pages/account/Table";
import { TestStats } from "../../components/pages/account/TestStats";
import { UserProfile } from "../../components/pages/profile/UserProfile";
import * as DB from "../../db";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { filters, setFilters } from "../../states/result-filters";
import { showSimpleModal } from "../../states/simple-modal";
import { getSnapshot } from "../../states/snapshot";
import { qs } from "../../utils/dom";
import {
  createDesktopBackup,
  parseDesktopBackup,
  restoreDesktopBackup,
} from "../backup";
import { filterDashboardResults, resultsToCsv } from "../dashboard";
import { openTextFile, saveTextFile } from "../native-files";
import { reloadDesktopApp } from "../native-window";
import { clearDesktopData, loadDesktopData } from "../storage";

export function DesktopAccountPage(): JSXElement {
  const [data, setData] = createSignal(loadDesktopData());
  const [sorting, setSorting] = createSignal<{
    field: keyof SnapshotResult<Mode>;
    direction: "asc" | "desc";
  }>({
    direction: "desc",
    field: "timestamp",
  });
  const [visibleResults, setVisibleResults] = createSignal(10);
  const [selectedResultId, setSelectedResultId] = createSignal<string | null>(
    null,
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
    filterDashboardResults(allResults(), filters),
  );
  const queryState = createMemo(() => createResultsQueryState(filters));
  const resultsQuery = useResultsLiveQuery({
    queryState,
    sorting,
    limit: () => visibleResults() + 1,
  });
  createEffect(() => {
    JSON.stringify(filters);
    setVisibleResults(10);
    setSelectedResultId(null);
  });

  const exportCsv = async (): Promise<void> => {
    try {
      const currentSorting = sorting();
      const direction = currentSorting.direction === "asc" ? 1 : -1;
      const exportResults = [...filteredResults()].sort((left, right) => {
        const leftValue = left[currentSorting.field];
        const rightValue = right[currentSorting.field];
        return typeof leftValue === "number" && typeof rightValue === "number"
          ? (leftValue - rightValue) * direction
          : 0;
      });
      const saved = await saveTextFile(
        "monkeytype-results.csv",
        resultsToCsv(exportResults),
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
            afterHide: reloadDesktopApp,
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
        await Promise.all([DB.initSnapshot(), refreshDesktopResults()]);
        return {
          status: "success",
          message: "Local typing data cleared",
        };
      },
    });
  };

  const selectChartResult = (event: { _id: string; index: number }): void => {
    setSorting({ direction: "desc", field: "timestamp" });
    setVisibleResults(
      Math.max(visibleResults(), Math.ceil((event.index + 1) / 10) * 10),
    );
    setSelectedResultId(event._id);
    requestAnimationFrame(() => {
      qs(`#resultList tbody tr:nth-child(${event.index + 1})`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  return (
    <Page id="account">
      <div class="desktopDashboard flex flex-col gap-8">
        <Show when={getSnapshot()} fallback="no local profile found">
          {(profile) => (
            <UserProfile
              profile={profile()}
              isAccountPage
              hideLeaderboards
              accountActions={
                <>
                  <Button
                    fa={{ icon: "fa-download", fixedWidth: true }}
                    balloon={{
                      text: "Export local backup",
                      position: "left",
                    }}
                    class="h-full rounded-none rounded-tr text-sub hover:text-bg"
                    onClick={() => void exportBackup()}
                  />
                  <Button
                    fa={{ icon: "fa-upload", fixedWidth: true }}
                    balloon={{
                      text: "Restore local backup",
                      position: "left",
                    }}
                    class="h-full rounded-none rounded-br text-sub hover:text-bg"
                    onClick={() => void chooseBackup()}
                  />
                </>
              }
            />
          )}
        </Show>

        <Filters filters={filters} onChangeFilters={setFilters} />

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
          <Charts
            filters={filters}
            queryState={queryState}
            onHistoryChartClick={selectChartResult}
          />

          <TestStats queryState={queryState} />

          <div class="grid grid-cols-3">
            <Button
              fa={{ icon: "fa-file-csv" }}
              text="export CSV"
              class="col-start-3 w-full"
              disabled={filteredResults().length === 0}
              onClick={() => void exportCsv()}
            />
          </div>

          <AsyncContent collections={{ resultsQuery }}>
            {({ resultsQueryData }) => (
              <>
                <Table
                  data={resultsQueryData().slice(0, visibleResults())}
                  onSortingChange={setSorting}
                  selectedRowId={selectedResultId}
                />
                <Button
                  text="load more"
                  disabled={
                    resultsQuery.isLoading ||
                    resultsQueryData().length <= visibleResults()
                  }
                  onClick={() => setVisibleResults((current) => current + 10)}
                  class="w-full text-center"
                />
              </>
            )}
          </AsyncContent>
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
