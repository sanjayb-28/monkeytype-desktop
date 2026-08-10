import type { Mode } from "@monkeytype/schemas/shared";

import type { SnapshotResult } from "../constants/default-snapshot";
import {
  ModifiableTestActivityCalendar,
  TestActivityCalendar,
} from "../elements/test-activity-calendar";
import { getFirstDayOfTheWeek } from "../utils/date-and-time";

export function buildDesktopTestActivity(
  results: SnapshotResult<Mode>[],
  emptyCalendarDate = new Date(),
): ModifiableTestActivityCalendar {
  const firstDayOfTheWeek = getFirstDayOfTheWeek();
  if (results.length === 0) {
    return new ModifiableTestActivityCalendar(
      [],
      emptyCalendarDate,
      firstDayOfTheWeek,
    );
  }

  const counts = new Map<number, number>();
  for (const result of results) {
    const date = new Date(result.timestamp);
    const day = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const days = [...counts.keys()].sort((left, right) => left - right);
  const firstDay = days[0] as number;
  const lastDay = days.at(-1) as number;
  const testsByDays: number[] = [];
  for (let day = firstDay; day <= lastDay; day += 24 * 60 * 60 * 1000) {
    testsByDays.push(counts.get(day) ?? 0);
  }

  return new ModifiableTestActivityCalendar(
    testsByDays,
    new Date(lastDay),
    firstDayOfTheWeek,
  );
}

export function buildDesktopTestActivityForYear(
  results: SnapshotResult<Mode>[],
  year: number,
): TestActivityCalendar {
  const firstDayOfTheWeek = getFirstDayOfTheWeek();
  const firstDay = Date.UTC(year, 0, 1);
  const lastDay = Date.UTC(year, 11, 31);
  const testsByDays: number[] = [];

  const counts = new Map<number, number>();
  for (const result of results) {
    const date = new Date(result.timestamp);
    if (date.getUTCFullYear() !== year) continue;
    const day = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  for (let day = firstDay; day <= lastDay; day += 24 * 60 * 60 * 1000) {
    testsByDays.push(counts.get(day) ?? 0);
  }

  return new TestActivityCalendar(
    testsByDays,
    new Date(lastDay),
    firstDayOfTheWeek,
    true,
  );
}
