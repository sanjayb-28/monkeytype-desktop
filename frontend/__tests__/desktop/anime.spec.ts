import { afterEach, describe, expect, it, vi } from "vitest";
import { animate } from "../../src/ts/desktop/anime";

describe("desktop Anime.js scheduler", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("renders and completes with the final inline style", async () => {
    const element = document.createElement("div");
    element.style.opacity = "0";
    document.body.append(element);
    const onComplete = vi.fn();

    animate(element, {
      opacity: [0, 1],
      duration: 125,
      ease: "linear",
      onComplete,
    });

    await new Promise((resolve) => window.setTimeout(resolve, 175));

    expect(Number(element.style.opacity)).toBeCloseTo(1, 5);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("uses the native animation-frame clock instead of a fixed 60 Hz ticker", () => {
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame");
    const element = document.createElement("div");
    document.body.append(element);

    animate(element, {
      opacity: [0, 1],
      duration: 125,
      ease: "linear",
    });

    expect(requestAnimationFrame).toHaveBeenCalled();
    requestAnimationFrame.mockRestore();
  });

  it("restarts the scheduler after a completed animation", async () => {
    const element = document.createElement("div");
    document.body.append(element);
    const animation = animate(element, {
      opacity: [0, 1],
      duration: 50,
      ease: "linear",
    });

    await new Promise((resolve) => window.setTimeout(resolve, 75));
    animation.restart();
    await new Promise((resolve) => window.setTimeout(resolve, 75));

    expect(Number(element.style.opacity)).toBeCloseTo(1, 5);
    expect(animation.completed).toBe(true);
  });

  it("restarts the scheduler when a paused animation resumes", async () => {
    const element = document.createElement("div");
    document.body.append(element);
    const animation = animate(element, {
      opacity: [0, 1],
      duration: 100,
      ease: "linear",
    });

    await new Promise((resolve) => window.setTimeout(resolve, 35));
    animation.pause();
    const pausedOpacity = Number(element.style.opacity);
    await new Promise((resolve) => window.setTimeout(resolve, 100));

    expect(Number(element.style.opacity)).toBeCloseTo(pausedOpacity, 5);
    expect(animation.completed).toBe(false);

    animation.resume();
    await new Promise((resolve) => window.setTimeout(resolve, 125));

    expect(Number(element.style.opacity)).toBeCloseTo(1, 5);
    expect(animation.completed).toBe(true);
  });
});
