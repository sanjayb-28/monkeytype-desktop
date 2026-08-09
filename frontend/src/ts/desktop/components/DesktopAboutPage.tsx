import type { JSXElement } from "solid-js";

import { H2, H3 } from "../../components/common/Headers";
import { Page } from "../../components/common/Page";
import { CommandlineHotkey } from "../../components/hotkeys/CommandlineHotkey";
import { QuickRestartHotkey } from "../../components/hotkeys/QuickRestartHotkey";

export function DesktopAboutPage(): JSXElement {
  return (
    <Page id="about">
      <div class="content-grid grid gap-8">
        <section class="text-center text-sub">
          Monkeytype for macOS.
          <br />
          Current Monkeytype typing engine, entirely local.
        </section>
        <section>
          <H2 fa={{ icon: "fa-info-circle" }} text="about" />
          <p>
            This port preserves Monkeytype&apos;s minimal, customizable typing
            test, themes, sounds, smooth caret, test modes, and result detail.
            It has no accounts, ads, analytics, cloud sync, or leaderboards.
            Settings, personal bests, and test history stay on this Mac.
          </p>
        </section>
        <section>
          <H3 fa={{ icon: "fa-keyboard" }} text="keybinds" />
          <p>
            Use <QuickRestartHotkey /> to restart. Open the command line with{" "}
            <CommandlineHotkey /> to change modes and settings without leaving
            the keyboard.
          </p>
        </section>
        <section>
          <H3 fa={{ icon: "fa-lock" }} text="offline by design" />
          <p>
            The app is packaged without web authentication, advertising,
            telemetry, or update checks. Its content policy only permits bundled
            app resources and local native file dialogs.
          </p>
        </section>
        <section>
          <H3 fa={{ icon: "fa-code" }} text="open source" />
          <p>
            Monkeytype is created by Miodec and its contributors and licensed
            under GPL-3.0. This desktop port keeps that license and attribution.
          </p>
        </section>
      </div>
    </Page>
  );
}
