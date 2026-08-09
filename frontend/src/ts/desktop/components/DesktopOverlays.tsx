import type { JSXElement } from "solid-js";

import { ScrollToTop } from "../../components/layout/footer/ScrollToTop";
import { LoaderBar } from "../../components/layout/overlays/LoaderBar";
import { Notifications } from "../../components/layout/overlays/Notifications";

export function DesktopOverlays(): JSXElement {
  return (
    <>
      <ScrollToTop />
      <Notifications />
      <LoaderBar />
    </>
  );
}
