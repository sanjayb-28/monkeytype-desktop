import { animate } from "animejs";
import { configLoadPromise } from "../config/lifecycle";
import * as DB from "../db";
import * as Misc from "../utils/misc";
import * as MonkeyPower from "../elements/monkey-power";
import { onDOMReady, qs } from "../utils/dom";

export const desktopReady = new Promise<void>((resolve) => {
  onDOMReady(async () => {
    await configLoadPromise;
    await DB.initSnapshot();

    qs("body")?.setStyle({
      transition: "background .25s, transform .05s",
    });
    const app = document.querySelector<HTMLElement>("#app");
    app?.classList.remove("hidden");
    if (app !== null) {
      animate(app, {
        opacity: [0, 1],
        duration: Misc.applyReducedMotion(250),
      });
    }
    MonkeyPower.init();
    resolve();
  });
});
