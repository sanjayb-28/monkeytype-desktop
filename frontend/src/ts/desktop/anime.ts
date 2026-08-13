import type {
  AnimationParams,
  DOMTargetsParam,
  JSAnimation,
  Timer,
  TimerParams,
} from "animejs";
import { animate as animeAnimate } from "animejs/animation";
import { engine } from "animejs/engine";
import { createTimer as animeCreateTimer } from "animejs/timer";

type DesktopEngine = typeof engine & {
  _head: unknown | null;
};

const desktopEngine = engine as DesktopEngine;
let tickTimer: number | undefined;

function stopTicker(): void {
  if (tickTimer === undefined) return;
  window.clearInterval(tickTimer);
  tickTimer = undefined;
}

function wakeDesktopEngine(): typeof engine {
  engine.paused = false;
  if (tickTimer !== undefined) return engine;

  tickTimer = window.setInterval(() => {
    engine.update();
    if (desktopEngine._head === null) stopTicker();
  }, 1000 / 60);

  return engine;
}

// Anime.js' requestAnimationFrame loop can stop advancing inside a packaged
// WKWebView. Keep Anime.js' original renderer and lifecycle intact, but drive
// its engine with a timer while animations are active. Overriding wake means
// play, resume, restart, reverse, and timers all restart the driver naturally.
engine.useDefaultMainLoop = false;
engine.wake = wakeDesktopEngine;

export function animate(
  targets: DOMTargetsParam,
  animationParams: AnimationParams,
): JSAnimation {
  return animeAnimate(targets, animationParams);
}

export function createTimer(timerParams?: TimerParams): Timer {
  return animeCreateTimer(timerParams);
}

export { engine };
