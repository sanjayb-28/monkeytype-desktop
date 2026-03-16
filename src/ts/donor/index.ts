// Rewritten entry point — no backend/auth/ads/cookies/account
import "./event-handlers/global";
import "./event-handlers/keymap";
import "./event-handlers/test";
import "./event-handlers/settings";

import * as Logger from "./utils/logger";
import * as DB from "./db";
import "./ui";
import Config, { loadFromLocalStorage } from "./config";
import * as TestStats from "./test/test-stats";
import * as Replay from "./test/replay";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";
import { enable } from "./states/glarses-mode";
import "./test/caps-warning";
import "./modals/simple-modals";
import "./input/listeners";
import "./controllers/route-controller";
import "./elements/no-css";
import "./test/tts";
import { addToGlobal } from "./utils/misc";
import * as Focus from "./test/focus";
import * as TodayTracker from "./test/today-tracker";
import { applyEngineSettings } from "./anim";
import { qs, qsa, qsr } from "./utils/dom";
import { mountComponents } from "./components/mount";
import { navigate } from "./controllers/route-controller";
import { configLoadPromise } from "./config";
import "./ready";

// Lock Math.random
Object.defineProperty(Math, "random", {
  value: Math.random,
  writable: false,
  configurable: false,
  enumerable: true,
});

// Freeze Math object
Object.freeze(Math);

// Lock Math on window
Object.defineProperty(window, "Math", {
  value: Math,
  writable: false,
  configurable: false,
  enumerable: true,
});

applyEngineSettings();
void loadFromLocalStorage();
Focus.set(true, true);

// No Firebase init, no cookies, no auth callback
void DB.initSnapshot().then(() => {
  // Load today's typing time from stored results
  TodayTracker.addAllFromToday();
});

// Simulate the AuthEvent that normally triggers initial navigation
// In the original app, firebase auth fires authStateChanged which triggers
// route-controller's AuthEvent subscriber to call navigate() and remove body.loading
void configLoadPromise.then(async () => {
  await navigate("/", { force: true });
  document.body.classList.remove("loading");
});

addToGlobal({
  snapshot: DB.getSnapshot,
  config: Config,
  glarsesMode: enable,
  stats: TestStats.getStats,
  replay: Replay.getReplayExport,
  enableTimerDebug: TestTimer.enableTimerDebug,
  getTimerStats: TestTimer.getTimerStats,
  toggleSmoothedBurst: Result.toggleSmoothedBurst,
  toggleDebugLogs: Logger.toggleDebugLogs,
  qs: qs,
  qsa: qsa,
  qsr: qsr,
});

mountComponents();
