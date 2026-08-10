import type {
  AnimationParams,
  DOMTargetsParam,
  JSAnimation,
  WAAPIAnimationParams,
} from "animejs";
import { WAAPIAnimation } from "animejs/waapi";

export { engine } from "animejs/engine";
export { createTimer } from "animejs/timer";

/**
 * Anime.js' JavaScript animation engine does not advance reliably inside the
 * packaged WKWebView. Its WAAPI backend uses the same animation parameters but
 * delegates frame scheduling to WebKit, so desktop keeps the original motion
 * without leaving elements at their initial (often transparent) state.
 */
export function animate(
  targets: DOMTargetsParam,
  animationParams: AnimationParams,
): JSAnimation {
  const {
    onBegin,
    onBeforeUpdate,
    onUpdate,
    onLoop: _onLoop,
    onPause,
    onRender,
    easing,
    ...params
  } = animationParams;

  const waapiParams = {
    ...params,
    ease: params.ease ?? easing,
  } as WAAPIAnimationParams;
  const animation = new WAAPIAnimation(targets, waapiParams);
  const callbackAnimation = animation as unknown as JSAnimation;
  const nativePause = animation.pause.bind(animation);
  const nativeCancel = animation.cancel.bind(animation);
  let startedAt = performance.now();
  let tickTimer: number | undefined;
  let didComplete = false;

  const complete = (): void => {
    if (didComplete) return;
    didComplete = true;
    window.clearInterval(tickTimer);
    animation.seek(animation.duration, true);
    animation.completed = true;
    animation.onComplete(animation);
    (animation._resolve as () => void)();
  };

  const tick = (): void => {
    if (animation.paused || didComplete) return;
    const elapsed = Math.min(performance.now() - startedAt, animation.duration);
    onBeforeUpdate?.(callbackAnimation);
    animation.seek(elapsed, true);
    onUpdate?.(callbackAnimation);
    onRender?.(callbackAnimation);
    if (elapsed >= animation.duration) complete();
  };

  const startTicker = (): void => {
    window.clearInterval(tickTimer);
    tickTimer = window.setInterval(tick, 1000 / 60);
    tick();
  };

  // The native WAAPI timeline can stall inside a packaged WKWebView. Keep the
  // browser's interpolation/easing, but advance its current time with reliable
  // JavaScript timers so desktop animations remain smooth and deterministic.
  nativePause();
  animation.paused = false;
  onBegin?.(callbackAnimation);
  startTicker();

  animation.pause = () => {
    window.clearInterval(tickTimer);
    onPause?.(callbackAnimation);
    return nativePause();
  };

  animation.cancel = () => {
    window.clearInterval(tickTimer);
    didComplete = true;
    return nativeCancel();
  };

  animation.restart = () => {
    didComplete = false;
    animation.completed = false;
    animation.seek(0, true);
    startedAt = performance.now();
    animation.paused = false;
    startTicker();
    return animation;
  };

  return callbackAnimation;
}
