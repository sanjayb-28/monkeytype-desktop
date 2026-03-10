// DESKTOP: No-op account page stub
import Page from "./page";
import { qsr } from "../utils/dom";

export function toggleFilterDebug(): void {}
export function update(): void {}
export function reset(): void {}

export const page = new Page({
  id: "account",
  element: qsr(".page.pageAccount"),
  path: "/account",
});
