// DESKTOP: Activity calendar built from local result timestamps
import { JSXElement, onMount } from "solid-js";
import { UTCDateMini } from "@date-fns/utc/date/mini";
import { differenceInDays } from "date-fns/differenceInDays";

import * as DB from "../../../db";
import { TestActivityCalendar } from "../../../elements/test-activity-calendar";
import {
  init as initTestActivity,
  clear as clearTestActivity,
} from "../../../elements/test-activity";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { getFirstDayOfTheWeek } from "../../../utils/date-and-time";

const firstDayOfTheWeek = getFirstDayOfTheWeek();

function buildCalendarFromResults(): TestActivityCalendar | undefined {
  const snapshot = DB.getSnapshot();
  if (!snapshot || !snapshot.results || snapshot.results.length === 0) {
    return undefined;
  }

  const results = snapshot.results;

  // Find date range: earliest result to today
  const now = new UTCDateMini();
  const timestamps = results.map((r) => r.timestamp);
  const earliest = new UTCDateMini(Math.min(...timestamps));

  const totalDays = differenceInDays(now, earliest);

  // Build an array of test counts per day, indexed from earliest to today
  const dayCounts: (number | null)[] = new Array(totalDays + 1).fill(null);

  for (const result of results) {
    const resultDate = new UTCDateMini(result.timestamp);
    const dayIndex = differenceInDays(resultDate, earliest);
    if (dayIndex >= 0 && dayIndex < dayCounts.length) {
      dayCounts[dayIndex] = (dayCounts[dayIndex] ?? 0) + 1;
    }
  }

  return new TestActivityCalendar(
    dayCounts,
    now,
    firstDayOfTheWeek,
  );
}

export function LocalActivityCalendar(): JSXElement {
  const [elementRef, element] = useRefWithUtils<HTMLElement>();

  onMount(() => {
    const el = element();
    if (!el) return;

    const calendar = buildCalendarFromResults();
    if (calendar === undefined) {
      clearTestActivity(el.native);
      return;
    }

    initTestActivity(el.native, calendar);

    const title = el.native.querySelector(".title");
    if (title) {
      title.innerHTML = calendar.getTotalTests() + " tests last 12 months";
    }
  });

  return (
    <div class="testActivity" ref={elementRef}>
      <div class="wrapper">
        <div class="top">
          <div class="title"></div>
          <div class="legend">
            <span>less</span>
            <div data-level="0"></div>
            <div data-level="1"></div>
            <div data-level="2"></div>
            <div data-level="3"></div>
            <div data-level="4"></div>
            <span>more</span>
          </div>
        </div>
        <div class="activity"></div>
        <div class="months"></div>
        <div class="daysFull"></div>
        <div class="days"></div>
        <div class="nodata hidden">No data found.</div>
        <div class="note">Note: All activity data is using UTC time.</div>
      </div>
    </div>
  );
}
