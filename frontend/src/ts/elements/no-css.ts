import { envConfig } from "virtual:env-config";
import { qs } from "../utils/dom";

if (envConfig.isDesktop) {
  qs("#nocss")?.setHtml(`
    <div style="display:grid;max-width:800px;gap:1rem">
      <span style="font-size:6rem;color:#e2b714">:(</span>
      <span style="font-size:1.5rem;color:#d1d0c5">
        Monkeytype Desktop could not load its interface.
      </span>
      <span>Quit and reopen the app. If the problem continues, reinstall the latest Apple Silicon build. Your local data remains in the app container.</span>
      <span class="requestedJs"></span>
    </div>
  `);
}

qs("#nocss .requestedStylesheets")?.setHtml(
  `Requested stylesheets:<br>${(
    [...document.querySelectorAll("link[rel=stylesheet")] as HTMLAnchorElement[]
  )
    .map((l) => l.href)
    .filter((l) => /\/css\/style/gi.test(l))
    .join("<br>")}`,
);

qs("#nocss .requestedJs")?.setHtml(
  `Requested Javascript files:<br>${(
    [...document.querySelectorAll("script")] as HTMLScriptElement[]
  )
    .map((l) => l.src)
    .filter((l) => /(\/js\/mon|\/js\/vendor)/gi.test(l))
    .join("<br>")}<br><br>Client version:<br>${envConfig.clientVersion}`,
);

if (window.navigator.userAgent.toLowerCase().includes("mac")) {
  qs("#nocss .keys")?.setHtml(`
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
        margin-top: 1rem;
        margin-bottom: 1rem;
      "
    >
      Cmd
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      Shift
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      R
    </span>
  `);
} else {
  qs("#nocss .keys")?.setHtml(`
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
        margin-bottom: 1rem;
      "
    >
      Ctrl
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      Shift
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      R
    </span>
  `);
}
