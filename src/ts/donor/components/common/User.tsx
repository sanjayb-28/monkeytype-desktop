// DESKTOP: Simplified User component — no discord avatar, no badges, no flags
import { AnimationParams } from "animejs";
import { createEffect, createSignal, JSXElement, on, Show } from "solid-js";

import { cn } from "../../utils/cn";
import { Anime } from "./anime";
import { Fa } from "./Fa";

type Props = {
  class?: string;
  name: string;
  level?: number;
  showSpinner?: boolean;
  hideNameOnSmallScreens?: boolean;
  fontClass?: "text-em-xs" | "text-em-sm" | "text-em-md" | "text-em-lg";
};

export function User(props: Props): JSXElement {
  const [flashAnimation, setFlashAnimation] = createSignal<
    AnimationParams | undefined
  >(undefined);
  const [isAnimating, setIsAnimating] = createSignal(false);
  let levelEl: HTMLElement | undefined;

  createEffect(
    on(
      () => props.level,
      () => {
        const rand = (Math.random() * 2 - 1) / 4;
        const rand2 = (Math.random() + 1) / 2;
        setFlashAnimation({
          scale: [1 + 0.5 * rand2, 1],
          backgroundColor: [
            "var(--themable-button-active)",
            "var(--themable-button-text)",
          ],
          rotate: [10 * rand, 0],
          duration: 2000,
          ease: "out(5)",
          onBegin: () => setIsAnimating(true),
          onComplete: () => {
            setIsAnimating(false);
            if (levelEl) {
              levelEl.style.backgroundColor = "";
            }
          },
        });
      },
      { defer: true },
    ),
  );

  return (
    <div
      class={cn(
        "grid grid-flow-col place-items-center gap-[0.5em]",
        props.class,
      )}
    >
      <div class="w-[1.25em] grid place-items-center">
        <Show
          when={!(props.showSpinner ?? false)}
          fallback={<Fa icon={"fa-circle-notch"} spin={true} />}
        >
          <Fa icon="fa-user" />
        </Show>
      </div>
      <div
        class={cn(props.fontClass, {
          "hidden sm:block": props.hideNameOnSmallScreens,
        })}
      >
        {props.name}
      </div>
      <Show when={props.level !== undefined}>
        <Anime
          ref={(el) => (levelEl = el)}
          animation={flashAnimation()}
          class={cn(
            "bg-(--themable-button-text) text-(--bg-color)",
            "rounded-half px-[0.5em] py-[0.1em] text-[0.7em]",
            { "transition-colors duration-125": !isAnimating() },
          )}
          data-ui-element="userLevel"
        >
          {props.level}
        </Anime>
      </Show>
    </div>
  );
}
