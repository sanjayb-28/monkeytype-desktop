import { createSignal, For, type JSXElement, onCleanup } from "solid-js";

import { H2 } from "../../components/common/Headers";
import { Page } from "../../components/common/Page";
import { loadDesktopData } from "../storage";

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export function DesktopAccountPage(): JSXElement {
  const [data, setData] = createSignal(loadDesktopData());
  const refresh = () => setData(loadDesktopData());
  window.addEventListener("monkeytype:desktop-data-updated", refresh);
  onCleanup(() =>
    window.removeEventListener("monkeytype:desktop-data-updated", refresh),
  );

  const recent = () => [...data().results].reverse().slice(0, 20);

  return (
    <Page id="account">
      <div class="grid gap-8">
        <H2 fa={{ icon: "fa-chart-line" }} text="local activity" />
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat
            label="tests completed"
            value={data().typingStats.completedTests}
          />
          <Stat
            label="time typing"
            value={formatDuration(data().typingStats.timeTyping)}
          />
          <Stat
            label="personal bests"
            value={data().results.filter((it) => it.isPb).length}
          />
        </div>
        <section class="grid gap-3">
          <div class="text-xl text-text">recent tests</div>
          <div class="grid gap-2">
            <For
              each={recent()}
              fallback={
                <div class="rounded bg-sub-alt p-6 text-center text-sub">
                  Complete a test to start your local history.
                </div>
              }
            >
              {(result) => (
                <div class="grid grid-cols-[1fr_auto_auto] items-center gap-6 rounded bg-sub-alt px-4 py-3">
                  <div>
                    <div class="text-text">
                      {result.mode} {result.mode2}
                    </div>
                    <div class="text-em-xs text-sub">
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xl text-main">
                      {Math.round(result.wpm)}
                    </div>
                    <div class="text-em-xs text-sub">wpm</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xl text-text">
                      {Math.round(result.acc)}%
                    </div>
                    <div class="text-em-xs text-sub">accuracy</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      </div>
    </Page>
  );
}

function Stat(props: { label: string; value: string | number }): JSXElement {
  return (
    <div class="rounded bg-sub-alt p-5 text-center">
      <div class="text-3xl text-main">{props.value}</div>
      <div class="text-xs text-sub">{props.label}</div>
    </div>
  );
}
