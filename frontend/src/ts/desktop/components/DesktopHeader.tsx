import type { JSXElement } from "solid-js";

import { Button } from "../../components/common/Button";
import { Logo } from "../../components/layout/header/Logo";
import { restartTestEvent } from "../../events/test";
import { getActivePage, getIsScreenshotting } from "../../states/core";
import { getFocus } from "../../states/test";
import { cn } from "../../utils/cn";

export function DesktopHeader(): JSXElement {
  const buttonClass = () =>
    cn("aspect-square", { "opacity-(--nav-focus-opacity)": getFocus() });
  return (
    <header
      class={cn("flex place-items-center gap-2", {
        "opacity-0": getIsScreenshotting(),
      })}
      data-ui-element="header"
    >
      <Logo />
      <nav class="z-5 flex w-full items-center gap-1 md:gap-2">
        <Button
          variant="text"
          fa={{ icon: "fa-keyboard", fixedWidth: true }}
          router-link
          href="/"
          class={buttonClass()}
          active={getActivePage() === "test"}
          balloon={{ text: "typing test", position: "down" }}
          onClick={() => {
            if (getActivePage() === "test") restartTestEvent.dispatch();
          }}
        />
        <Button
          variant="text"
          fa={{ icon: "fa-chart-line", fixedWidth: true }}
          router-link
          href="/account"
          class={buttonClass()}
          active={getActivePage() === "account"}
          balloon={{ text: "local activity", position: "down" }}
        />
        <Button
          variant="text"
          fa={{ icon: "fa-info", fixedWidth: true }}
          router-link
          href="/about"
          class={buttonClass()}
          active={getActivePage() === "about"}
          balloon={{ text: "about", position: "down" }}
        />
        <Button
          variant="text"
          fa={{ icon: "fa-cog", fixedWidth: true }}
          router-link
          href="/settings"
          class={buttonClass()}
          active={getActivePage() === "settings"}
          balloon={{ text: "settings", position: "down" }}
        />
        <div class="grow"></div>
        <div class="px-2 text-em-xs text-sub">offline</div>
      </nav>
    </header>
  );
}
