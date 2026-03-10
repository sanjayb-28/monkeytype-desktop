// DESKTOP: No-op stub
import Page from "./page";
import { qsr } from "../utils/dom";

export function update(): void {}

export const page = new Page({
  id: "login",
  element: qsr(".page.pageLogin"),
  path: "/login",
});
