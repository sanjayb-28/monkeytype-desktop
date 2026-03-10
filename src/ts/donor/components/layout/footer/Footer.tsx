import { JSXElement } from "solid-js";

import { getFocus, getIsScreenshotting } from "../../../signals/core";
import { cn } from "../../../utils/cn";
import { Keytips } from "./Keytips";
import { ThemeIndicator } from "./ThemeIndicator";

// DESKTOP: Footer stripped to theme switcher only — no external links
export function Footer(): JSXElement {
  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      <Keytips />

      <div
        class="-m-2 flex justify-end gap-8 transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <div class="flex flex-col items-end text-right lg:flex-row">
          <ThemeIndicator />
        </div>
      </div>
    </footer>
  );
}
