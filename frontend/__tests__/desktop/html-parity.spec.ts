import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const frontendRoot = process.cwd().endsWith("/frontend")
  ? process.cwd()
  : resolve(process.cwd(), "frontend");
const webHtmlPath = resolve(frontendRoot, "src/index.html");
const desktopHtmlPath = resolve(frontendRoot, "src/desktop.html");

const intentionallyOnlineElementIds = new Set([
  "ad-footer",
  "ad-footer-small",
  "ad-footer-small-wrapper",
  "ad-footer-wrapper",
  "ad-vertical-left",
  "ad-vertical-left-wrapper",
  "ad-vertical-right",
  "ad-vertical-right-wrapper",
  "div-gpt-ad-mkt-0",
  "solidpopups",
]);

const intentionallyOnlineMounts = new Set([
  "accountsettingspage",
  "devtools",
  "friendspage",
  "leaderboardpage",
  "loginpage",
  "popups",
  "profilepage",
  "profilesearchpage",
]);

function attributes(html: string, attribute: string): Set<string> {
  return new Set(
    [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, "g"))].map(
      (match) => match[1] as string,
    ),
  );
}

describe("desktop HTML parity", () => {
  it("keeps every shared element id from the web shell", async () => {
    const [webHtml, desktopHtml] = await Promise.all([
      readFile(webHtmlPath, "utf8"),
      readFile(desktopHtmlPath, "utf8"),
    ]);
    const desktopIds = attributes(desktopHtml, "id");
    const missingIds = [...attributes(webHtml, "id")].filter(
      (id) => !desktopIds.has(id) && !intentionallyOnlineElementIds.has(id),
    );

    expect(missingIds).toEqual([]);
  });

  it("keeps every shared component mount from the web shell", async () => {
    const [webHtml, desktopHtml] = await Promise.all([
      readFile(webHtmlPath, "utf8"),
      readFile(desktopHtmlPath, "utf8"),
    ]);
    const desktopMounts = attributes(desktopHtml, "data-component");
    const missingMounts = [...attributes(webHtml, "data-component")].filter(
      (mount) =>
        !desktopMounts.has(mount) && !intentionallyOnlineMounts.has(mount),
    );

    expect(missingMounts).toEqual([]);
  });
});
