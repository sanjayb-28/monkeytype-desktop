import { JSXElement } from "solid-js";
import { envConfig } from "virtual:env-config";

import { getIsScreenshotting } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Logo } from "./Logo";
import { Nav } from "./Nav";

export function Header(): JSXElement {
  return (
    <header
      class={cn("flex place-items-center gap-2", {
        "opacity-0": getIsScreenshotting(),
      })}
      data-ui-element="header"
      data-focused={getFocus() ? "" : undefined}
      data-tauri-drag-region={envConfig.isDesktop ? "" : undefined}
    >
      <Logo />
      <Nav />
    </header>
  );
}
