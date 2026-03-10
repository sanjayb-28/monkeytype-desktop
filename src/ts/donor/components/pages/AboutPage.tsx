import { JSXElement } from "solid-js";

import { Button } from "../common/Button";
import { H2, H3 } from "../common/Headers";

export function prefetchAboutPage(): void {}

// DESKTOP: Rewritten About page — local-only app, no server queries
export function AboutPage(): JSXElement {
  return (
    <div class="content-grid grid gap-8">
      <section class="text-center text-sub">
        Monkeytype Desktop — a local, offline typing test.
        <br />
        Built by Sanjay Baskaran. Based on{" "}
        <a href="https://github.com/monkeytypegame/monkeytype" target="_blank">
          Monkeytype
        </a>{" "}
        by Miodec.
      </section>
      <section>
        <H2 fa={{ icon: "fa-info-circle" }} text="about" />
        <p>
          This is a native desktop version of Monkeytype, the popular
          minimalistic and customizable typing test. It runs entirely offline
          with no account or internet connection required.
          <br />
          <br />
          It features many of the same test modes, themes, sounds, and
          customization options as the original web app. Test yourself in
          various modes, track your progress and improve your speed — all
          locally on your machine.
        </p>
      </section>
      <section>
        <H3 fa={{ icon: "fa-align-left" }} text="word set" />
        <p>
          By default, this app uses the most common 200 words in the English
          language to generate its tests. You can change to an expanded set
          (1000 most common words) in the settings, or change the language
          entirely.
        </p>
      </section>
      <section>
        <H3 fa={{ icon: "fa-keyboard" }} text="keybinds" />
        <p>
          You can use <kbd>tab</kbd> and <kbd>enter</kbd> (or just{" "}
          <kbd>tab</kbd> if you have quick tab mode enabled) to restart the
          typing test. Open the command line by pressing <kbd>ctrl/cmd</kbd> +{" "}
          <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd> — there you can
          access all the functionality you need without touching your mouse.
        </p>
      </section>
      <section>
        <H3 fa={{ icon: "fa-list-ol" }} text="stats" />
        <dl class="grid">
          <dt class="col-1 mr-4">wpm</dt>
          <dd class="col-2">
            - total number of characters in the correctly typed words (including
            spaces), divided by 5 and normalised to 60 seconds.
          </dd>

          <dt class="col-1 mr-4">raw wpm</dt>
          <dd class="col-2">
            {" "}
            - calculated just like wpm, but also includes incorrect words.
          </dd>

          <dt class="col-1 mr-4">acc</dt>
          <dd class="col-2"> - percentage of correctly pressed keys.</dd>

          <dt class="col-1 mr-4">char</dt>
          <dd class="col-2">
            - correct characters / incorrect characters. Calculated after the
            test has ended.
          </dd>

          <dt class="col-1 mr-4">consistency</dt>
          <dd class="col-2">
            - based on the variance of your raw wpm. Closer to 100% is better.
            Calculated using the coefficient of variation of raw wpm and mapped
            onto a scale from 0 to 100.
          </dd>
        </dl>
      </section>
      <section>
        <H3 fa={{ icon: "fa-chart-area" }} text="results screen" />
        <p>
          After completing a test you will see your wpm, raw wpm, accuracy,
          character stats, and test info. You can also see a graph of your wpm
          and raw over the duration of the test.
        </p>
      </section>
      <div></div>
      <section>
        <H2 fa={{ icon: "fa-users" }} text="credits" />
        <p>
          This desktop app is based on the open-source{" "}
          <Button
            variant="text"
            text="Monkeytype"
            href="https://github.com/monkeytypegame/monkeytype"
            class="p-0 pt-2 pr-2 pb-2"
          />
          project created by Miodec and maintained by the Monkeytype community.
        </p>
        <p>
          All typing engine logic, themes, languages, and test modes originate
          from the original project. This desktop version adapts the frontend
          for local-only use via Tauri.
        </p>
        <p class="mt-4 text-sub">
          Licensed under the GPL-3.0 license.
        </p>
      </section>
    </div>
  );
}
