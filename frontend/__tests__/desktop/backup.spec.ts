import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { getDefaultConfig } from "../../src/ts/constants/default-config";
import defaultResultFilters from "../../src/ts/constants/default-result-filters";
import { parseDesktopBackup } from "../../src/ts/desktop/backup";
import { defaultDesktopData } from "../../src/ts/desktop/storage";

describe("desktop backup", () => {
  it("rejects unknown and malformed backup versions", () => {
    expect(() => parseDesktopBackup("{}")).toThrow(/not a valid/i);
    expect(() =>
      parseDesktopBackup(
        JSON.stringify({
          format: "monkeytype-desktop-backup",
          version: 99,
        }),
      ),
    ).toThrow(/not a valid/i);
  });

  it("accepts and upgrades a complete version 2 backup", () => {
    const data = defaultDesktopData();
    const backup = parseDesktopBackup(
      JSON.stringify({
        format: "monkeytype-desktop-backup",
        version: 2,
        exportedAt: new Date().toISOString(),
        data,
        config: getDefaultConfig(),
        files: {},
      }),
    );

    expect(backup.version).toBe(3);
    expect(backup.data).toEqual(data);
  });

  it("round-trips displayed tag and preset names with spaces", () => {
    const data = defaultDesktopData();
    data.customThemes = [
      {
        _id: "local_theme",
        name: "night_shift",
        colors: [
          "#111111",
          "#222222",
          "#333333",
          "#444444",
          "#555555",
          "#666666",
          "#777777",
          "#888888",
          "#999999",
          "#aaaaaa",
        ],
      },
    ];
    data.presets = [{ _id: "local_preset", name: "short sprint", config: {} }];
    data.resultFilterPresets = [
      {
        ...structuredClone(defaultResultFilters),
        _id: "local_result_filter",
        name: "focused results",
      },
    ];
    data.tags = [
      {
        _id: "local_tag",
        name: "deep focus",
        active: true,
        personalBests: {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        },
      },
    ];

    const backup = parseDesktopBackup(
      JSON.stringify({
        format: "monkeytype-desktop-backup",
        version: 3,
        exportedAt: new Date().toISOString(),
        data,
        config: getDefaultConfig(),
        files: {},
      }),
    );

    expect(backup.data.presets[0]?.name).toBe("short sprint");
    expect(backup.data.resultFilterPresets[0]?.name).toBe("focused results");
    expect(backup.data.tags[0]?.name).toBe("deep focus");
    expect(backup.data.customThemes[0]?.name).toBe("night_shift");
  });
});
