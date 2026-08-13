import { configLoadPromise } from "../config/lifecycle";
import * as DB from "../db";
import * as MonkeyPower from "../elements/monkey-power";
import * as TestUI from "../test/test-ui";
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
    app?.classList.add("invisible");
    app?.classList.remove("hidden");
    MonkeyPower.init();
    await showMainWindow();

    // The hidden Tauri window is maximized immediately before it is shown.
    // Re-measure the test at its visible size so its three-line viewport and
    // caret/input positions match the web app on the first frame.
    try {
      document.body.getBoundingClientRect();
      TestUI.updateWordsWrapperHeight(true);
      window.dispatchEvent(new Event("resize"));
    } finally {
      app?.classList.remove("invisible");
    }
    resolve();
  });
});
