import type { JSXElement } from "solid-js";

import { QueryClientProvider } from "@tanstack/solid-query";
import { render } from "solid-js/web";

import { Theme } from "../components/core/Theme";
import { CommandlineHotkey } from "../components/hotkeys/CommandlineHotkey";
import { Footer } from "../components/layout/footer/Footer";
import { Header } from "../components/layout/header/Header";
import { NotFoundPage } from "../components/pages/404Page";
import { SettingsPage } from "../components/pages/settings/SettingsPage";
import { CapsWarning } from "../components/pages/test/CapsWarning";
import { CompositionDisplay } from "../components/pages/test/CompositionDisplay";
import { Keymap } from "../components/pages/test/Keymap";
import { BarTimerProgress } from "../components/pages/test/live-stats/BarTimerProgress";
import { LiveStatsMini } from "../components/pages/test/live-stats/LiveStatsMini";
import { LiveStatsTextBottom } from "../components/pages/test/live-stats/LiveStatsTextBottom";
import { LiveStatsTextTop } from "../components/pages/test/live-stats/LiveStatsTextTop";
import { TestModesNotice } from "../components/pages/test/modes-notice/TestModesNotice";
import { Monkey } from "../components/pages/test/Monkey";
import { OutOfFocusWarning } from "../components/pages/test/OutOfFocusWarning";
import { Premid } from "../components/pages/test/Premid";
import { TestConfig } from "../components/pages/test/TestConfig";
import { queryClient } from "../queries";
import { qsa } from "../utils/dom";
import { DesktopAboutPage } from "./components/DesktopAboutPage";
import { DesktopAccountPage } from "./components/DesktopAccountPage";
import { DesktopModals } from "./components/DesktopModals";
import { DesktopOverlays } from "./components/DesktopOverlays";

const components: Record<string, () => JSXElement> = {
  theme: () => <Theme />,
  overlays: () => <DesktopOverlays />,
  modals: () => <DesktopModals />,
  header: () => <Header />,
  footer: () => <Footer />,
  aboutpage: () => <DesktopAboutPage />,
  accountpage: () => <DesktopAccountPage />,
  settingspage: () => <SettingsPage />,
  notfoundpage: () => <NotFoundPage />,
  testconfig: () => <TestConfig />,
  commandlinehotkey: () => <CommandlineHotkey />,
  testmodesnotice: () => <TestModesNotice />,
  capswarning: () => <CapsWarning />,
  compositiondisplay: () => <CompositionDisplay />,
  keymap: () => <Keymap />,
  monkey: () => <Monkey />,
  outoffocuswarning: () => <OutOfFocusWarning />,
  livestatsmini: () => <LiveStatsMini />,
  livestatstexttop: () => <LiveStatsTextTop />,
  livestatstextbottom: () => <LiveStatsTextBottom />,
  bartimerprogress: () => <BarTimerProgress />,
  premid: () => <Premid />,
};

export function mountDesktopComponents(): void {
  for (const [name, component] of Object.entries(components)) {
    for (const mountPoint of qsa(`mount[data-component=${name}]`)) {
      render(
        () => (
          <QueryClientProvider client={queryClient}>
            {component()}
          </QueryClientProvider>
        ),
        mountPoint.native,
      );
    }
  }
}
