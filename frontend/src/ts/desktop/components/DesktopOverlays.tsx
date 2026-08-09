import type { JSXElement } from "solid-js";

import { Fa } from "../../components/common/Fa";
import { ScrollToTop } from "../../components/layout/footer/ScrollToTop";
import { FpsCounter } from "../../components/layout/overlays/FpsCounter";
import { LoaderBar } from "../../components/layout/overlays/LoaderBar";
import { Notifications } from "../../components/layout/overlays/Notifications";
import { getIsScreenshotting } from "../../states/core";
import { showModal } from "../../states/modals";
import { cn } from "../../utils/cn";

export function DesktopOverlays(): JSXElement {
  return (
    <>
      <ScrollToTop />
      <button
        type="button"
        id="commandLineMobileButton"
        class={cn(
          "fixed bottom-8 left-8 z-99 hidden h-12 w-12 rounded-full bg-main text-center leading-12 text-bg md:hidden",
          { "opacity-0": getIsScreenshotting() },
        )}
        aria-label="Open command line"
        tabIndex="-1"
        onClick={() => showModal("Commandline")}
      >
        <Fa icon="fa-terminal" />
      </button>
      <Notifications />
      <LoaderBar />
      <FpsCounter />
    </>
  );
}
