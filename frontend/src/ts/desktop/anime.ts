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
const fallbackFrameInterval = 1000 / 60;
const stalledAnimationFrameThreshold = 125;

let animationFrameId: number | undefined;
let fallbackTimer: number | undefined;
let lastAnimationFrameAt = 0;

function stopTicker(): void {
  if (animationFrameId !== undefined) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = undefined;
  }
  if (fallbackTimer !== undefined) {
    window.clearInterval(fallbackTimer);
    fallbackTimer = undefined;
  }
}

function updateEngine(): void {
  engine.update();
  if (desktopEngine._head === null) stopTicker();
}

function scheduleAnimationFrame(): void {
  animationFrameId = window.requestAnimationFrame((timestamp) => {
    animationFrameId = undefined;
    lastAnimationFrameAt = timestamp;
    updateEngine();

    if (desktopEngine._head !== null) scheduleAnimationFrame();
  });
}

function wakeDesktopEngine(): typeof engine {
  engine.paused = false;
  if (animationFrameId !== undefined || fallbackTimer !== undefined) {
    return engine;
  }

  // Prefer the browser compositor's own cadence. On the user's 100 Hz macOS
  // display this keeps desktop animations in lock-step with the web app instead
  // of capping them at 60 Hz.
  lastAnimationFrameAt = performance.now();
  updateEngine();
  if (desktopEngine._head === null) return engine;

  scheduleAnimationFrame();

  // WKWebView can occasionally stop delivering animation frames while the
  // window remains visible. Retain the previous 60 Hz timer only as a watchdog
  // for that failure mode; it never competes with a healthy rAF loop.
  fallbackTimer = window.setInterval(() => {
    if (
      performance.now() - lastAnimationFrameAt <
      stalledAnimationFrameThreshold
    ) {
      return;
    }
    updateEngine();
  }, fallbackFrameInterval);

  return engine;
}

// Keep Anime.js' renderer and lifecycle intact. A native rAF loop is used when
// WKWebView is healthy, with a timer fallback for the packaged-WebKit stall
// that originally required this desktop adapter.
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
