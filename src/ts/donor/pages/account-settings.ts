// No-op stub
import Page from "./page";
import { qsr } from "../utils/dom";

export function updateUI(): void {}
export function update(): void {}

export const page = new Page({
  id: "accountSettings",
  element: qsr(".page.pageAccountSettings"),
  path: "/account-settings",
});
