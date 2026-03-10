import { JSXElement } from "solid-js";

import { getFocus, getIsScreenshotting } from "../../../signals/core";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Keytips } from "./Keytips";
import { ThemeIndicator } from "./ThemeIndicator";

export function Footer(): JSXElement {
  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      <Keytips />

      <div
        class="-m-2 flex justify-between gap-8 transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <div class="grid grid-cols-1 justify-items-start lg:flex">
          <Button
            variant="text"
            text="github"
            fa={{
              icon: "fa-code",
              fixedWidth: true,
            }}
            href="https://github.com/sanjayb-28/monkeytype-desktop"
          />
        </div>
        <div class="flex flex-col items-end text-right lg:flex-row">
          <ThemeIndicator />
        </div>
      </div>
    </footer>
  );
}
