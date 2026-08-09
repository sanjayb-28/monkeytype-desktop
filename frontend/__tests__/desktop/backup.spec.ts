import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { getDefaultConfig } from "../../src/ts/constants/default-config";
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

  it("accepts a complete versioned backup", () => {
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

    expect(backup.version).toBe(2);
    expect(backup.data).toEqual(data);
  });
});
