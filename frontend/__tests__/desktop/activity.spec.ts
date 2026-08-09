import type { Mode } from "@monkeytype/schemas/shared";
import { describe, expect, it } from "vitest";

import type { SnapshotResult } from "../../src/ts/constants/default-snapshot";
import { buildDesktopTestActivity } from "../../src/ts/desktop/activity";

const resultAt = (timestamp: number): SnapshotResult<Mode> =>
  ({ timestamp }) as SnapshotResult<Mode>;

describe("desktop activity adapter", () => {
  it("feeds locally persisted results into the original activity calendar", () => {
    const firstDay = Date.UTC(2026, 7, 7, 10);
    const secondDay = Date.UTC(2026, 7, 8, 22);
    const calendar = buildDesktopTestActivity([
      resultAt(firstDay),
      resultAt(secondDay),
      resultAt(secondDay),
    ]);

    expect(calendar.getTotalTests()).toBe(3);
    expect(
      calendar.getDays().some((day) => day.label?.startsWith("2 tests on")),
    ).toBe(true);
  });

  it("creates an empty original calendar without synthetic activity", () => {
    const calendar = buildDesktopTestActivity([], new Date(2026, 7, 8));
    expect(calendar.getTotalTests()).toBe(0);
  });
});
