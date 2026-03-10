import { createSignal } from "solid-js";
import { ColorName, Theme } from "../constants/themes";
import { ThemeName } from "@monkeytype/schemas/configs";

export type ThemeIdentifier = ThemeName | "custom";
const defaultTheme: Theme & { name: ThemeIdentifier } = {
  name: "dracula",
  bg: "#282a36",
  main: "#bd93f9",
  caret: "#bd93f9",
  sub: "#6272a4",
  subAlt: "#20222c",
  text: "#f8f8f2",
  error: "#ff5555",
  errorExtra: "#f1fa8c",
  colorfulError: "#ff5555",
  colorfulErrorExtra: "#f1fa8c",
};

export const [getTheme, setTheme] = createSignal<
  Theme & { name: ThemeIdentifier }
>(defaultTheme);

export function updateThemeColor(key: ColorName, color: string): void {
  setTheme((prev) => ({
    ...prev,
    [key]: color,
  }));
}
