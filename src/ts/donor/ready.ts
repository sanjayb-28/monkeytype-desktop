import * as Misc from "./utils/misc";
import * as MonkeyPower from "./elements/monkey-power";
import { configLoadPromise } from "./config";
import { authPromise } from "./firebase";
import { animate } from "animejs";
import { onDOMReady, qs } from "./utils/dom";

onDOMReady(async () => {
  await configLoadPromise;
  await authPromise;

  //this line goes back to pretty much the beginning of the project and im pretty sure its here
  //to make sure the initial theme application doesnt animate the background color
  qs("body")?.setStyle({
    transition: "background .25s, transform .05s",
  });
  // merch banner disabled, server config stubbed, no service worker

  const app = document.querySelector("#app") as HTMLElement;
  app?.classList.remove("hidden");
  animate(app, {
    opacity: [0, 1],
    duration: Misc.applyReducedMotion(250),
  });

  MonkeyPower.init();
});
