import { configLoadPromise } from "../config/lifecycle";
import * as DB from "../db";
import * as MonkeyPower from "../elements/monkey-power";
import { onDOMReady, qs } from "../utils/dom";
import { showMainWindow } from "./native-window";

export const desktopReady = new Promise<void>((resolve) => {
  onDOMReady(async () => {
    await configLoadPromise;
    await DB.initSnapshot();

    qs("body")?.setStyle({
      transition: "background .25s, transform .05s",
    });
    const app = document.querySelector<HTMLElement>("#app");
    app?.classList.remove("hidden");
    MonkeyPower.init();
    await showMainWindow();
    resolve();
  });
});
