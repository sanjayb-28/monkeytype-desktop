// Local account page — all data from localStorage, no server.
import * as DB from "../db";
import type { LocalResult } from "../db";
import * as ResultFilters from "../elements/account/result-filters";
import * as ChartController from "../controllers/chart-controller";
import Config, { setConfig } from "../config";
import * as Focus from "../test/focus";
import * as TodayTracker from "../test/today-tracker";
import { showErrorNotification } from "../stores/notifications";
import Page from "./page";
import * as DateTime from "../utils/date-and-time";
import * as Misc from "../utils/misc";
import * as Numbers from "@monkeytype/util/numbers";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import { format } from "date-fns/format";
import * as Skeleton from "../utils/skeleton";
import type { ScaleChartOptions, LinearScaleOptions } from "chart.js";
import * as ConfigEvent from "../observables/config-event";
import { getActivePage } from "../signals/core";
import Format from "../utils/format";
import { findLineByLeastSquares } from "../utils/numbers";
import { SortedTableWithLimit } from "../utils/sorted-table";
import { qs, qsa, qsr, onDOMReady } from "../utils/dom";
import type { AccountChart } from "@monkeytype/schemas/configs";

let filterDebug = false;
export function toggleFilterDebug(): void {
  filterDebug = !filterDebug;
  if (filterDebug) console.log("filterDebug is on");
}

let filteredResults: LocalResult[] = [];
let visibleTableLines = 0;
let historyTable: SortedTableWithLimit<LocalResult>;
let filtersInitialized = false;

function loadMoreLines(lineIndex?: number): void {
  if (filteredResults === undefined || filteredResults.length === 0) return;
  let newVisibleLines;
  if (Numbers.isSafeNumber(lineIndex) && lineIndex > visibleTableLines) {
    newVisibleLines = Math.ceil(lineIndex / 10) * 10;
  } else {
    newVisibleLines = visibleTableLines + 10;
  }

  visibleTableLines = newVisibleLines;
  if (visibleTableLines >= filteredResults.length) {
    qs(".pageAccount .loadMoreButton")?.hide();
  } else {
    qs(".pageAccount .loadMoreButton")?.show();
  }

  historyTable.setLimit(newVisibleLines);
  historyTable.updateBody();
}

function buildResultRow(result: LocalResult): HTMLTableRowElement {
  const diff = result.difficulty ?? "normal";

  let icons = `<span aria-label="${result.language?.replace(
    "_",
    " ",
  )}" data-balloon-pos="up"><i class="fas fa-fw fa-globe-americas"></i></span>`;

  if (diff === "normal") {
    icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="far fa-fw fa-star"></i></span>`;
  } else if (diff === "expert") {
    icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="fas fa-fw fa-star-half-alt"></i></span>`;
  } else if (diff === "master") {
    icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="fas fa-fw fa-star"></i></span>`;
  }

  if (result.punctuation) {
    icons += `<span aria-label="punctuation" data-balloon-pos="up"><i class="fas fa-fw fa-at"></i></span>`;
  }
  if (result.numbers) {
    icons += `<span aria-label="numbers" data-balloon-pos="up"><i class="fas fa-fw fa-hashtag"></i></span>`;
  }
  if (result.blindMode) {
    icons += `<span aria-label="blind mode" data-balloon-pos="up"><i class="fas fa-fw fa-eye-slash"></i></span>`;
  }
  if (result.lazyMode) {
    icons += `<span aria-label="lazy mode" data-balloon-pos="up"><i class="fas fa-fw fa-couch"></i></span>`;
  }

  if (result.funbox !== undefined && result.funbox.length > 0 && result.funbox !== "none") {
    icons += `<span aria-label="${result.funbox.replace(/_/g, " ").replace(/,/g, ", ")}" data-balloon-pos="up"><i class="fas fa-gamepad"></i></span>`;
  }

  let pb = "";
  if (result.isPb) {
    pb = '<i class="fas fa-fw fa-crown"></i>';
  }

  const charStats = result.charStats ? result.charStats.join("/") : "-";
  const mode2 = result.mode === "custom" ? "" : result.mode2;
  const date = new Date(result.timestamp);

  const element = document.createElement("tr");
  element.classList.add("resultRow");
  element.dataset["id"] = result._id;
  element.innerHTML = `
    <td>${pb}</td>
    <td>${Format.typingSpeed(result.wpm, { showDecimalPlaces: true })}</td>
    <td>${Format.typingSpeed(result.rawWpm, { showDecimalPlaces: true })}</td>
    <td>${Format.percentage(result.acc, { showDecimalPlaces: true })}</td>
    <td>${Format.percentage(result.consistency, { showDecimalPlaces: true })}</td>
    <td>${charStats}</td>
    <td>${result.mode} ${mode2}</td>
    <td class="infoIcons">${icons}</td>
    <td>${format(date, "dd MMM yyyy")}<br>
    ${format(date, "HH:mm")}
    </td>
    `;

  return element;
}

export function reset(): void {
  if (!historyTable) return;
  historyTable.setData([]);
  historyTable.updateBody();

  ChartController.accountHistogram.getDataset("count").data = [];
  ChartController.accountActivity.getDataset("count").data = [];
  ChartController.accountActivity.getDataset("avgWpm").data = [];
  ChartController.accountHistory.getDataset("wpm").data = [];
  ChartController.accountHistory.getDataset("pb").data = [];
  ChartController.accountHistory.getDataset("acc").data = [];
  ChartController.accountHistory.getDataset("wpmAvgTen").data = [];
  ChartController.accountHistory.getDataset("accAvgTen").data = [];
  ChartController.accountHistory.getDataset("wpmAvgHundred").data = [];
  ChartController.accountHistory.getDataset("accAvgHundred").data = [];
}

let totalSecondsFiltered = 0;
let chartData: ChartController.HistoryChartData[] = [];
let accChartData: ChartController.AccChartData[] = [];

async function fillContent(): Promise<void> {
  console.log("updating account page");

  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  chartData = [];
  accChartData = [];
  const wpmChartData: number[] = [];
  visibleTableLines = 0;

  let topWpm = 0;
  let topMode = "";
  let testRestarts = 0;
  let totalWpm = 0;
  let testCount = 0;

  let last10 = 0;
  let wpmLast10total = 0;

  let topAcc = 0;
  let totalAcc = 0;
  let totalAcc10 = 0;

  const rawWpm = {
    total: 0,
    count: 0,
    last10Total: 0,
    last10Count: 0,
    max: 0,
  };

  let totalEstimatedWords = 0;
  totalSecondsFiltered = 0;

  let topCons = 0;
  let totalCons = 0;
  let totalCons10 = 0;
  let consCount = 0;

  type ActivityChartData = Record<
    number,
    {
      restarts: number;
      amount: number;
      time: number;
      maxWpm: number;
      totalWpm: number;
      totalAcc: number;
      totalCon: number;
    }
  >;

  const activityChartData: ActivityChartData = {};
  const histogramChartData: number[] = [];
  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);

  filteredResults = [];
  qs(".pageAccount .history table tbody")?.empty();

  // Iterate results (sorted newest first in storage)
  const allResults = snapshot.results ?? [];
  for (const result of allResults) {
    // Apply filters
    try {
      // PB filter
      if (!ResultFilters.getFilter("pb", result.isPb ? "yes" : "no")) {
        if (filterDebug) console.log(`skipping result due to pb filter`, result);
        continue;
      }

      // Difficulty filter
      const resdiff = result.difficulty ?? "normal";
      if (!ResultFilters.getFilter("difficulty", resdiff)) {
        if (filterDebug) console.log(`skipping result due to difficulty filter`, result);
        continue;
      }

      // Mode filter
      if (!ResultFilters.getFilter("mode", result.mode)) {
        if (filterDebug) console.log(`skipping result due to mode filter`, result);
        continue;
      }

      // Time sub-filter
      if (result.mode === "time") {
        let timefilter = "custom";
        if (["15", "30", "60", "120"].includes(`${result.mode2}`)) {
          timefilter = `${result.mode2}`;
        }
        if (!ResultFilters.getFilter("time", timefilter)) {
          if (filterDebug) console.log(`skipping result due to time filter`, result);
          continue;
        }
      } else if (result.mode === "words") {
        let wordfilter = "custom";
        if (["10", "25", "50", "100", "200"].includes(`${result.mode2}`)) {
          wordfilter = `${result.mode2}`;
        }
        if (!ResultFilters.getFilter("words", wordfilter)) {
          if (filterDebug) console.log(`skipping result due to word filter`, result);
          continue;
        }
      }

      // Quote length filter
      if (result.quoteLength !== undefined && result.quoteLength !== null && result.quoteLength >= 0) {
        let filter: string | undefined = undefined;
        if (result.quoteLength === 0) filter = "short";
        else if (result.quoteLength === 1) filter = "medium";
        else if (result.quoteLength === 2) filter = "long";
        else if (result.quoteLength === 3) filter = "thicc";
        if (filter !== undefined && !ResultFilters.getFilter("quoteLength", filter)) {
          if (filterDebug) console.log(`skipping result due to quoteLength filter`, result);
          continue;
        }
      }

      // Punctuation filter
      const puncfilter = result.punctuation ? "on" : "off";
      if (!ResultFilters.getFilter("punctuation", puncfilter)) {
        if (filterDebug) console.log(`skipping result due to punctuation filter`, result);
        continue;
      }

      // Numbers filter
      const numfilter = result.numbers ? "on" : "off";
      if (!ResultFilters.getFilter("numbers", numfilter)) {
        if (filterDebug) console.log(`skipping result due to numbers filter`, result);
        continue;
      }

      // Date filter
      const timeSinceTest = Math.abs(result.timestamp - Date.now()) / 1000;
      let datehide = true;
      if (
        ResultFilters.getFilter("date", "all") ||
        (ResultFilters.getFilter("date", "last_day") && timeSinceTest <= 86400) ||
        (ResultFilters.getFilter("date", "last_week") && timeSinceTest <= 604800) ||
        (ResultFilters.getFilter("date", "last_month") && timeSinceTest <= 2592000) ||
        (ResultFilters.getFilter("date", "last_3months") && timeSinceTest <= 7776000)
      ) {
        datehide = false;
      }
      if (datehide) {
        if (filterDebug) console.log(`skipping result due to date filter`, result);
        continue;
      }

      filteredResults.push(result);
    } catch (e) {
      console.error(e);
      ResultFilters.reset();
      ResultFilters.updateActive();
      void update();
      return;
    }

    // ===== Filters passed — aggregate stats =====

    totalEstimatedWords += Math.round((result.wpm / 60) * result.testDuration);

    const resultDate = new Date(result.timestamp);
    resultDate.setSeconds(0);
    resultDate.setMinutes(0);
    resultDate.setHours(0);
    resultDate.setMilliseconds(0);
    const resultTimestamp = resultDate.getTime();

    const dataForTimestamp = activityChartData[resultTimestamp];
    if (dataForTimestamp !== undefined) {
      dataForTimestamp.amount++;
      dataForTimestamp.restarts += result.restartCount ?? 0;
      dataForTimestamp.time +=
        result.testDuration +
        (result.incompleteTestSeconds ?? 0) -
        (result.afkDuration ?? 0);
      if (result.wpm > dataForTimestamp.maxWpm) {
        dataForTimestamp.maxWpm = result.wpm;
      }
      dataForTimestamp.totalWpm += result.wpm;
      dataForTimestamp.totalAcc += result.acc;
      dataForTimestamp.totalCon += result.consistency ?? 0;
    } else {
      activityChartData[resultTimestamp] = {
        amount: 1,
        restarts: result.restartCount ?? 0,
        time:
          result.testDuration +
          (result.incompleteTestSeconds ?? 0) -
          (result.afkDuration ?? 0),
        maxWpm: result.wpm,
        totalWpm: result.wpm,
        totalAcc: result.acc,
        totalCon: result.consistency ?? 0,
      };
    }

    const bucketSize = typingSpeedUnit.histogramDataBucketSize;
    const bucket = Math.floor(
      Math.round(typingSpeedUnit.fromWpm(result.wpm)) / bucketSize,
    );
    if (histogramChartData.length <= bucket) {
      for (let i = histogramChartData.length; i <= bucket; i++) {
        histogramChartData.push(0);
      }
    }
    (histogramChartData[bucket] as number)++;

    let tt = 0;
    if (
      result.testDuration === undefined &&
      result.mode2 !== "custom" &&
      result.mode2 !== "zen"
    ) {
      // estimate for legacy results without testDuration
      if (result.mode === "time") {
        tt = parseInt(result.mode2);
      } else if (result.mode === "words") {
        tt = (parseInt(result.mode2) / result.wpm) * 60;
      }
    } else {
      tt = parseFloat(result.testDuration as unknown as string);
    }
    if (result.incompleteTestSeconds !== undefined) {
      tt += result.incompleteTestSeconds;
    } else if (result.restartCount !== undefined && result.restartCount > 0) {
      tt += (tt / 4) * result.restartCount;
    }
    totalSecondsFiltered += tt;

    if (last10 < 10) {
      last10++;
      wpmLast10total += result.wpm;
      totalAcc10 += result.acc;
      if (result.consistency !== undefined) {
        totalCons10 += result.consistency;
      }
    }
    testCount++;

    if (result.consistency !== undefined) {
      consCount++;
      totalCons += result.consistency;
      if (result.consistency > topCons) {
        topCons = result.consistency;
      }
    }

    if (result.rawWpm !== null && result.rawWpm !== undefined) {
      if (rawWpm.last10Count < 10) {
        rawWpm.last10Count++;
        rawWpm.last10Total += result.rawWpm;
      }
      rawWpm.total += result.rawWpm;
      rawWpm.count++;
      if (result.rawWpm > rawWpm.max) {
        rawWpm.max = result.rawWpm;
      }
    }

    if (result.acc > topAcc) {
      topAcc = result.acc;
    }
    totalAcc += result.acc;

    if (result.restartCount !== undefined) {
      testRestarts += result.restartCount;
    }

    chartData.push({
      x: filteredResults.length,
      y: Numbers.roundTo2(typingSpeedUnit.fromWpm(result.wpm)),
      wpm: Numbers.roundTo2(typingSpeedUnit.fromWpm(result.wpm)),
      acc: result.acc,
      mode: result.mode,
      mode2: result.mode2,
      punctuation: result.punctuation,
      language: result.language,
      timestamp: result.timestamp,
      difficulty: result.difficulty,
      raw: Numbers.roundTo2(typingSpeedUnit.fromWpm(result.rawWpm)),
      isPb: result.isPb ?? false,
    });

    wpmChartData.push(result.wpm);

    accChartData.push({
      x: filteredResults.length,
      y: result.acc,
      errorRate: 100 - result.acc,
    });

    if (result.wpm > topWpm) {
      topWpm = result.wpm;
      if (result.mode === "custom") {
        topMode = result.mode;
      } else {
        const puncstring = result.punctuation ? ",<br>with punctuation" : "";
        const numbstring = result.numbers ? ",<br>with numbers" : "";
        topMode = result.mode + " " + result.mode2 + puncstring + numbstring;
      }
    }

    totalWpm += result.wpm;
  }

  historyTable.setData(filteredResults);

  qs(".pageAccount .group.history table thead tr td:nth-child(2)")?.setText(
    Config.typingSpeedUnit,
  );

  await Misc.sleep(0);
  loadMoreLines();

  // ===== Activity chart =====
  const activityChartData_timeAndAmount: ChartController.ActivityChartDataPoint[] = [];
  const activityChartData_avgWpm: ChartController.ActivityChartDataPoint[] = [];
  const wpmStepSize = typingSpeedUnit.historyStepSize;

  for (const date of Object.keys(activityChartData)) {
    const dateInt = parseInt(date);
    const dataPoint = activityChartData[dateInt];
    if (dataPoint === undefined) continue;

    activityChartData_timeAndAmount.push({
      x: dateInt,
      y: dataPoint.time / 60,
      amount: dataPoint.amount,
      restarts: dataPoint.restarts,
      maxWpm: Numbers.roundTo2(typingSpeedUnit.fromWpm(dataPoint.maxWpm)),
      avgWpm: Numbers.roundTo2(dataPoint.totalWpm / dataPoint.amount),
      avgAcc: Numbers.roundTo2(dataPoint.totalAcc / dataPoint.amount),
      avgCon: Numbers.roundTo2(dataPoint.totalCon / dataPoint.amount),
    });
    activityChartData_avgWpm.push({
      x: dateInt,
      y: Numbers.roundTo2(
        typingSpeedUnit.fromWpm(dataPoint.totalWpm) / dataPoint.amount,
      ),
    });
  }

  const accountActivityScaleOptions = (
    ChartController.accountActivity.options as ScaleChartOptions<"bar" | "line">
  ).scales;
  const accountActivityAvgWpmOptions = accountActivityScaleOptions[
    "avgWpm"
  ] as LinearScaleOptions;
  accountActivityAvgWpmOptions.title.text = "Average " + Config.typingSpeedUnit;
  accountActivityAvgWpmOptions.ticks.stepSize = wpmStepSize;

  ChartController.accountActivity.getDataset("count").data =
    activityChartData_timeAndAmount;
  ChartController.accountActivity.getDataset("avgWpm").data =
    activityChartData_avgWpm;

  // ===== Histogram chart =====
  const histogramChartDataBucketed: { x: number; y: number }[] = [];
  const labels: string[] = [];
  const bucketSize = typingSpeedUnit.histogramDataBucketSize;
  const bucketSizeUpperBound = bucketSize - (bucketSize <= 1 ? 0.01 : 1);

  histogramChartData.forEach((amount: number, i: number) => {
    const bucket = i * bucketSize;
    labels.push(`${bucket} - ${bucket + bucketSizeUpperBound}`);
    histogramChartDataBucketed.push({ x: bucket, y: amount });
  });

  ChartController.accountHistogram.data.labels = labels;
  ChartController.accountHistogram.getDataset("count").data =
    histogramChartDataBucketed;

  // ===== History chart =====
  const accountHistoryScaleOptions = (
    ChartController.accountHistory.options as ScaleChartOptions<"line">
  ).scales;
  const accountHistoryWpmOptions = accountHistoryScaleOptions[
    "wpm"
  ] as LinearScaleOptions;
  accountHistoryWpmOptions.title.text = typingSpeedUnit.fullUnitString;

  if (chartData.length > 0) {
    let currentPb = 0;
    const pb: { x: number; y: number }[] = [];
    for (let i = chartData.length - 1; i >= 0; i--) {
      const a = chartData[i] as ChartController.HistoryChartData;
      if (a.y > currentPb) {
        currentPb = a.y;
        pb.push(a);
      }
    }
    pb.push({
      x: 1,
      y: pb[pb.length - 1]?.y ?? 0,
    });

    const avgTen = [];
    const avgTenAcc = [];
    const avgHundred = [];
    const avgHundredAcc = [];

    for (let i = 0; i < chartData.length; i++) {
      const subsetTen = chartData.slice(i, i + 10);
      const accSubsetTen = accChartData.slice(i, i + 10);
      const avgTenValue =
        subsetTen.reduce((acc, { y }) => acc + y, 0) / subsetTen.length;
      const accAvgTenValue =
        accSubsetTen.reduce((acc, { y }) => acc + y, 0) / accSubsetTen.length;
      avgTen.push({ x: i + 1, y: avgTenValue });
      avgTenAcc.push({ x: i + 1, y: accAvgTenValue });

      const subsetHundred = chartData.slice(i, i + 100);
      const accSubsetHundred = accChartData.slice(i, i + 100);
      const avgHundredValue =
        subsetHundred.reduce((acc, { y }) => acc + y, 0) / subsetHundred.length;
      const accAvgHundredValue =
        accSubsetHundred.reduce((acc, { y }) => acc + y, 0) /
        accSubsetHundred.length;
      avgHundred.push({ x: i + 1, y: avgHundredValue });
      avgHundredAcc.push({ x: i + 1, y: accAvgHundredValue });
    }

    ChartController.accountHistory.getDataset("wpm").data = chartData;
    ChartController.accountHistory.getDataset("pb").data = pb;
    ChartController.accountHistory.getDataset("acc").data = accChartData;
    ChartController.accountHistory.getDataset("wpmAvgTen").data = avgTen;
    ChartController.accountHistory.getDataset("accAvgTen").data = avgTenAcc;
    ChartController.accountHistory.getDataset("wpmAvgHundred").data = avgHundred;
    ChartController.accountHistory.getDataset("accAvgHundred").data = avgHundredAcc;

    ChartController.accountHistory.getScale("x").max = chartData.length + 1;
  }

  const wpms = chartData.map((r) => r.y);
  const minWpm = Math.min(...wpms);
  const maxWpm = Math.max(...wpms);
  const minWpmChartVal = isFinite(minWpm) ? minWpm : 0;
  const maxWpmChartVal = isFinite(maxWpm) ? maxWpm : 0;
  const maxWpmChartValWithBuffer =
    Math.floor(maxWpmChartVal) +
    (wpmStepSize - (Math.floor(maxWpmChartVal) % wpmStepSize));

  accountHistoryWpmOptions.max = maxWpmChartValWithBuffer;
  accountHistoryWpmOptions.ticks.stepSize = wpmStepSize;

  ChartController.accountHistory.getScale("pb").max = maxWpmChartValWithBuffer;
  ChartController.accountHistory.getScale("wpmAvgTen").max = maxWpmChartValWithBuffer;
  ChartController.accountHistory.getScale("wpmAvgHundred").max = maxWpmChartValWithBuffer;

  if (!Config.startGraphsAtZero) {
    const minWpmChartValFloor =
      Math.floor(minWpmChartVal / wpmStepSize) * wpmStepSize;
    ChartController.accountHistory.getScale("wpm").min = minWpmChartValFloor;
    ChartController.accountHistory.getScale("pb").min = minWpmChartValFloor;
    ChartController.accountHistory.getScale("wpmAvgTen").min = minWpmChartValFloor;
    ChartController.accountHistory.getScale("wpmAvgHundred").min = minWpmChartValFloor;
  } else {
    ChartController.accountHistory.getScale("wpm").min = 0;
    ChartController.accountHistory.getScale("pb").min = 0;
    ChartController.accountHistory.getScale("wpmAvgTen").min = 0;
    ChartController.accountHistory.getScale("wpmAvgHundred").min = 0;
  }

  // ===== Show/hide sections =====
  if (chartData === undefined || chartData.length === 0) {
    qs(".pageAccount .group.noDataError")?.show();
    qs(".pageAccount .group.chart")?.hide();
    qs(".pageAccount .group.dailyActivityChart")?.hide();
    qs(".pageAccount .group.histogramChart")?.hide();
    qs(".pageAccount .group.history")?.hide();
    qs(".pageAccount .triplegroup.stats")?.hide();
    qs(".pageAccount .group.estimatedWordsTyped")?.hide();
  } else {
    qs(".pageAccount .group.noDataError")?.hide();
    qs(".pageAccount .group.chart")?.show();
    qs(".pageAccount .group.dailyActivityChart")?.show();
    qs(".pageAccount .group.histogramChart")?.show();
    qs(".pageAccount .group.history")?.show();
    qs(".pageAccount .triplegroup.stats")?.show();
    qs(".pageAccount .group.estimatedWordsTyped")?.show();
  }

  // ===== Populate stats =====
  qs(".pageAccount .timeTotalFiltered .val")?.setText(
    DateTime.secondsToString(Math.round(totalSecondsFiltered), true, true),
  );

  const speedUnit = Config.typingSpeedUnit;

  qs(".pageAccount .highestWpm .title")?.setText(`highest ${speedUnit}`);
  qs(".pageAccount .highestWpm .val")?.setText(Format.typingSpeed(topWpm));

  qs(".pageAccount .averageWpm .title")?.setText(`average ${speedUnit}`);
  qs(".pageAccount .averageWpm .val")?.setText(
    Format.typingSpeed(totalWpm / testCount),
  );

  qs(".pageAccount .averageWpm10 .title")?.setText(
    `average ${speedUnit} (last 10 tests)`,
  );
  qs(".pageAccount .averageWpm10 .val")?.setText(
    Format.typingSpeed(wpmLast10total / last10),
  );

  qs(".pageAccount .highestRaw .title")?.setText(`highest raw ${speedUnit}`);
  qs(".pageAccount .highestRaw .val")?.setText(Format.typingSpeed(rawWpm.max));

  qs(".pageAccount .averageRaw .title")?.setText(`average raw ${speedUnit}`);
  qs(".pageAccount .averageRaw .val")?.setText(
    Format.typingSpeed(rawWpm.total / rawWpm.count),
  );

  qs(".pageAccount .averageRaw10 .title")?.setText(
    `average raw ${speedUnit} (last 10 tests)`,
  );
  qs(".pageAccount .averageRaw10 .val")?.setText(
    Format.typingSpeed(rawWpm.last10Total / rawWpm.last10Count),
  );

  qs(".pageAccount .highestWpm .mode")?.setHtml(topMode);

  qs(".pageAccount .highestAcc .val")?.setText(Format.accuracy(topAcc));
  qs(".pageAccount .avgAcc .val")?.setText(
    Format.accuracy(totalAcc / testCount),
  );
  qs(".pageAccount .avgAcc10 .val")?.setText(
    Format.accuracy(totalAcc10 / last10),
  );

  if (totalCons === 0 || totalCons === undefined) {
    qs(".pageAccount .avgCons .val")?.setText("-");
    qs(".pageAccount .avgCons10 .val")?.setText("-");
  } else {
    qs(".pageAccount .highestCons .val")?.setText(Format.percentage(topCons));
    qs(".pageAccount .avgCons .val")?.setText(
      Format.percentage(totalCons / consCount),
    );
    qs(".pageAccount .avgCons10 .val")?.setText(
      Format.percentage(totalCons10 / Math.min(last10, consCount)),
    );
  }

  qs(".pageAccount .testsStarted .val")?.setText(`${testCount + testRestarts}`);
  qs(".pageAccount .testsCompleted .val")?.setText(
    `${testCount}(${Math.floor(
      (testCount / (testCount + testRestarts)) * 100,
    )}%)`,
  );

  if (testCount > 0) {
    qs(".pageAccount .testsCompleted .avgres")?.setText(
      `${(testRestarts / testCount).toFixed(1)} restarts per completed test`,
    );
  }

  const wpmPoints = filteredResults.map((r) => r.wpm).reverse();
  const trend = findLineByLeastSquares(wpmPoints);
  if (trend) {
    const wpmChange = trend[1][1] - trend[0][1];
    const wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);
    const plus = wpmChangePerHour > 0 ? "+" : "";
    qs(".pageAccount .group.chart .below .text")?.setText(
      `Speed change per hour spent typing: ${
        plus + Format.typingSpeed(wpmChangePerHour, { showDecimalPlaces: true })
      } ${Config.typingSpeedUnit}`,
    );
  }

  qs(".pageAccount .estimatedWordsTyped .val")?.setText(
    totalEstimatedWords.toString(),
  );

  // ===== Update charts =====
  if (chartData.length || accChartData.length) {
    ChartController.updateAccountChartButtons();
    ChartController.accountHistory.options.animation = false;
    ChartController.accountHistory.update();
    delete ChartController.accountHistory.options.animation;
  }
  await Misc.sleep(0);
  ChartController.accountActivity.update();
  ChartController.accountHistogram.update();
  Focus.set(false);
  qs(".page.pageAccount")?.setStyle({ height: "unset" });
}

async function update(): Promise<void> {
  try {
    TodayTracker.addAllFromToday();
    await Misc.sleep(0);
    await fillContent();
  } catch (e) {
    console.error(e);
    showErrorNotification(`Something went wrong: ${e}`);
  }
}

// ===== Event handlers =====

qs(".pageAccount button.toggleResultsOnChart")?.on("click", () => {
  const newValue = [...Config.accountChart] as AccountChart;
  newValue[0] = newValue[0] === "on" ? "off" : "on";
  setConfig("accountChart", newValue);
});

qs(".pageAccount button.toggleAccuracyOnChart")?.on("click", () => {
  const newValue = [...Config.accountChart] as AccountChart;
  newValue[1] = newValue[1] === "on" ? "off" : "on";
  setConfig("accountChart", newValue);
});

qs(".pageAccount button.toggleAverage10OnChart")?.on("click", () => {
  const newValue = [...Config.accountChart] as AccountChart;
  newValue[2] = newValue[2] === "on" ? "off" : "on";
  setConfig("accountChart", newValue);
});

qs(".pageAccount button.toggleAverage100OnChart")?.on("click", () => {
  const newValue = [...Config.accountChart] as AccountChart;
  newValue[3] = newValue[3] === "on" ? "off" : "on";
  setConfig("accountChart", newValue);
});

qs(".pageAccount .loadMoreButton")?.on("click", () => {
  loadMoreLines();
});

qs(".pageAccount #accountHistoryChart")?.on("click", () => {
  const index: number = ChartController.accountHistoryActiveIndex;
  loadMoreLines(index);
  if (window === undefined) return;

  const resultId = filteredResults[index]?._id;
  if (resultId === undefined) return;
  const element = qs(`.resultRow[data-id="${resultId}"`);
  qsa(".resultRow").removeClass("active");

  element?.native?.scrollIntoView({ block: "center" });
  element?.addClass("active");
});

// CSV export removed

ConfigEvent.subscribe(({ key }) => {
  if (getActivePage() === "account" && key === "typingSpeedUnit") {
    void update();
  }
});

export { update };

export const page = new Page<undefined>({
  id: "account",
  element: qsr(".page.pageAccount"),
  path: "/account",
  afterHide: async (): Promise<void> => {
    reset();
    Skeleton.remove("pageAccount");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageAccount", "main");

    if (!filtersInitialized) {
      ResultFilters.initFilterButtons(() => {
        void update();
      });
      filtersInitialized = true;
    }
    ResultFilters.updateActive();

    await Misc.sleep(0);

    historyTable ??= new SortedTableWithLimit<LocalResult>({
      limit: 10,
      table: qsr(".pageAccount .content .history table"),
      data: filteredResults,
      buildRow: (val) => buildResultRow(val),
      initialSort: { property: "timestamp", descending: true },
    });

    await update();
  },
});

onDOMReady(() => {
  Skeleton.save("pageAccount");
});
