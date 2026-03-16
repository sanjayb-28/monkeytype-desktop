// No-op stub
import Page from "./page";
import { qsr } from "../utils/dom";

export function update(): void {}

export const page = new Page({
  id: "friends",
  element: qsr(".page.pageFriends"),
  path: "/friends",
});
