import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ThemeWithName } from "../../../src/ts/constants/themes";

import { Theme } from "../../../src/ts/components/core/Theme";
import * as ThemeSignal from "../../../src/ts/states/theme";

vi.mock("virtual:env-config", () => ({
  envConfig: {
    isDesktop: true,
  },
}));

vi.mock("../../../src/ts/constants/themes", () => ({
  themes: {
    dark: { hasCss: true },
    light: {},
  },
}));

vi.mock("./FavIcon", () => ({
  FavIcon: () => <div id="favicon" />,
}));

describe("Theme component in the desktop WebView", () => {
  const [themeSignal, setThemeSignal] = createSignal<ThemeWithName>(
    {} as ThemeWithName,
  );
  const themeSignalMock = vi.spyOn(ThemeSignal, "getTheme");

  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.removeAttribute("style");
    document.head.querySelector("#currentTheme")?.remove();
    themeSignalMock.mockImplementation(() => themeSignal());
    setThemeSignal({
      name: "dark",
      bg: "#000",
      main: "#fff",
      caret: "#fff",
      sub: "#aaa",
      subAlt: "#888",
      text: "#fff",
      error: "#f00",
      errorExtra: "#c00",
      colorfulError: "#f55",
      colorfulErrorExtra: "#c55",
    });
  });

  it("writes theme variables directly and manages the theme stylesheet", () => {
    render(() => <Theme />);

    expect(document.documentElement.style.getPropertyValue("--bg-color")).toBe(
      "#000",
    );
    expect(
      document.documentElement.style.getPropertyPriority("--main-color"),
    ).toBe("important");
    expect(
      document.head.querySelector("link#currentTheme")?.getAttribute("href"),
    ).toBe("/themes/dark.css");

    setThemeSignal({
      ...themeSignal(),
      name: "serika",
      bg: "#f00",
    });

    expect(document.documentElement.style.getPropertyValue("--bg-color")).toBe(
      "#f00",
    );
    expect(
      document.documentElement.style.getPropertyPriority("--bg-color"),
    ).toBe("important");
    expect(document.head.querySelector("link#currentTheme")).toBeNull();
  });
});
