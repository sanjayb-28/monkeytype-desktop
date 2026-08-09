import type { JSXElement } from "solid-js";

import { Keytips } from "../../components/layout/footer/Keytips";
import { ThemeIndicator } from "../../components/layout/footer/ThemeIndicator";
import { getIsScreenshotting } from "../../states/core";
import { getFocus } from "../../states/test";
import { cn } from "../../utils/cn";

export function DesktopFooter(): JSXElement {
  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      <Keytips />
      <div
        class="flex justify-between transition-opacity"
        classList={{ "opacity-0": getFocus() }}
      >
        <span>local-only macOS app</span>
        <ThemeIndicator />
      </div>
    </footer>
  );
}
