// Simplified local result-filters for the account page.
// No server, no SlimSelect, no presets — just button-based toggles.

import Config from "../../config";
import { qs, qsa } from "../../utils/dom";

type FilterState = {
  date: Record<string, boolean>;
  difficulty: Record<string, boolean>;
  pb: Record<string, boolean>;
  mode: Record<string, boolean>;
  quoteLength: Record<string, boolean>;
  words: Record<string, boolean>;
  time: Record<string, boolean>;
  punctuation: Record<string, boolean>;
  numbers: Record<string, boolean>;
};

const defaultFilters: FilterState = {
  date: { last_day: false, last_week: false, last_month: false, last_3months: false, all: true },
  difficulty: { normal: true, expert: true, master: true },
  pb: { no: true, yes: true },
  mode: { words: true, time: true, quote: true, zen: true, custom: true },
  quoteLength: { short: true, medium: true, long: true, thicc: true },
  words: { "10": true, "25": true, "50": true, "100": true, custom: true },
  time: { "15": true, "30": true, "60": true, "120": true, custom: true },
  punctuation: { on: true, off: true },
  numbers: { on: true, off: true },
};

let filters: FilterState = JSON.parse(JSON.stringify(defaultFilters));

export function getFilter<G extends keyof FilterState>(
  group: G,
  key: string,
): boolean {
  return filters[group]?.[key] ?? true;
}

export function reset(): void {
  filters = JSON.parse(JSON.stringify(defaultFilters));
}

const groupIcons: Record<string, string> = {
  date: "fa-calendar",
  mode: "fa-bars",
  words: "fa-font",
  time: "fa-clock",
  difficulty: "fa-star",
  punctuation: "fa-at",
  numbers: "fa-hashtag",
  quoteLength: "fa-quote-right",
  pb: "fa-crown",
};

const groupLabels: Record<string, string> = {
  date: "Date",
  mode: "Mode",
  words: "Words",
  time: "Time",
  difficulty: "Difficulty",
  punctuation: "Punctuation",
  numbers: "Numbers",
  quoteLength: "Quote length",
  pb: "Personal best",
};

export function updateActive(): void {
  // Sync button active states with filter state
  for (const group of Object.keys(filters) as (keyof FilterState)[]) {
    const buttons = qsa(
      `.pageAccount .filterGroup[group="${group}"] button`,
    );
    buttons.forEach((btn) => {
      const filterVal = btn.getAttribute("filter");
      if (filterVal === null) return;
      if (filters[group]?.[filterVal]) {
        btn.addClass("active");
      } else {
        btn.removeClass("active");
      }
    });
  }

  // Build above-chart filter summary
  const aboveEl = qs(".pageAccount .group.chart .above");
  if (aboveEl) {
    let html = "";
    const displayOrder: (keyof FilterState)[] = [
      "date", "mode", "time", "words", "difficulty",
      "punctuation", "numbers",
    ];

    for (const group of displayOrder) {
      // Skip time/words if their mode isn't active
      if (group === "time" && !filters.mode["time"]) continue;
      if (group === "words" && !filters.mode["words"]) continue;

      const icon = groupIcons[group] ?? "fa-filter";
      const label = groupLabels[group] ?? group;
      const activeKeys = Object.keys(filters[group]).filter(
        (k) => filters[group][k],
      );
      const allKeys = Object.keys(filters[group]);
      const isAll = activeKeys.length === allKeys.length;
      const text = isAll
        ? "all"
        : activeKeys.join(", ").replace(/_/g, " ");

      html += `<div class="group"><span aria-label="${label}" data-balloon-pos="up"><i class="fas fa-fw ${icon}"></i>${text}</span></div>`;
      html += `<div class="spacer"></div>`;
    }

    // Remove trailing spacer
    html = html.replace(/<div class="spacer"><\/div>$/, "");
    aboveEl.setHtml(html);
  }
}

export function setAllFilters(): void {
  for (const group of Object.keys(filters) as (keyof FilterState)[]) {
    if (group === "date") {
      // For date, set "all" active and rest off
      for (const key of Object.keys(filters[group])) {
        filters[group][key] = key === "all";
      }
    } else {
      for (const key of Object.keys(filters[group])) {
        filters[group][key] = true;
      }
    }
  }
  updateActive();
}

export function setCurrentConfigFilters(): void {
  // Set everything to false first (like original app)
  for (const group of Object.keys(filters) as (keyof FilterState)[]) {
    for (const key of Object.keys(filters[group])) {
      filters[group][key] = false;
    }
  }

  // PB: both on (original keeps pb unfiltered)
  filters.pb.no = true;
  filters.pb.yes = true;

  // Difficulty: only current
  filters.difficulty[Config.difficulty] = true;

  // Mode: only current
  filters.mode[Config.mode] = true;

  // Sub-filter based on mode
  if (Config.mode === "time") {
    if ([15, 30, 60, 120].includes(Config.time)) {
      filters.time[`${Config.time}`] = true;
    } else {
      filters.time["custom"] = true;
    }
  } else if (Config.mode === "words") {
    if ([10, 25, 50, 100, 200].includes(Config.words)) {
      filters.words[`${Config.words}`] = true;
    } else {
      filters.words["custom"] = true;
    }
  } else if (Config.mode === "quote") {
    const qlNames = ["short", "medium", "long", "thicc"];
    for (const ql of Config.quoteLength) {
      if (qlNames[ql] !== undefined) {
        filters.quoteLength[qlNames[ql] as string] = true;
      }
    }
  }

  // Punctuation
  if (Config.punctuation) {
    filters.punctuation.on = true;
  } else {
    filters.punctuation.off = true;
  }

  // Numbers
  if (Config.numbers) {
    filters.numbers.on = true;
  } else {
    filters.numbers.off = true;
  }

  // Date: all time
  filters.date.all = true;

  updateActive();
}

export function toggleFilter(group: keyof FilterState, key: string): void {
  if (group === "date") {
    // Date filters are mutually exclusive
    for (const k of Object.keys(filters.date)) {
      filters.date[k] = k === key;
    }
  } else {
    filters[group][key] = !filters[group][key];
  }
  updateActive();
}

export function clearFilters(): void {
  // Turn off all advanced filters (set everything to false)
  for (const group of Object.keys(filters) as (keyof FilterState)[]) {
    if (group === "date") continue; // don't touch date
    for (const key of Object.keys(filters[group])) {
      filters[group][key] = false;
    }
  }
  updateActive();
}

// Initialize filter button click handlers
export function initFilterButtons(updateCallback: () => void): void {
  // Button-based filter groups
  const filterGroups = qsa(".pageAccount .filterGroup");
  filterGroups.forEach((groupEl) => {
    const group = groupEl.getAttribute("group") as keyof FilterState | null;
    if (!group || !(group in filters)) return;

    const buttons = groupEl.qsa("button");
    buttons.forEach((btn) => {
      const filterVal = btn.getAttribute("filter");
      if (!filterVal) return;

      btn.on("click", () => {
        toggleFilter(group, filterVal);
        updateCallback();
      });
    });
  });

  // "all" button
  qs(".pageAccount .allFilters")?.on("click", () => {
    setAllFilters();
    updateCallback();
  });

  // "current settings" button
  qs(".pageAccount .currentConfigFilter")?.on("click", () => {
    setCurrentConfigFilters();
    updateCallback();
  });

  // "clear filters" button
  qs(".pageAccount .noFilters")?.on("click", () => {
    clearFilters();
    updateCallback();
  });

  // "advanced" toggle
  qs(".pageAccount .toggleAdvancedFilters")?.on("click", () => {
    const advancedPanel = qs(".pageAccount .group.filterButtons");
    if (advancedPanel) {
      if (advancedPanel.hasClass("hidden")) {
        advancedPanel.show();
      } else {
        advancedPanel.hide();
      }
    }
  });

  // Set initial active states
  updateActive();
}
