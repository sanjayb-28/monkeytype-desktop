import { Link, Meta, MetaProvider, Style } from "@solidjs/meta";
import { createEffect, createMemo, JSXElement, Show } from "solid-js";
import { envConfig } from "virtual:env-config";

import { themes } from "../../constants/themes";
import { createDebouncedEffectOn, createEffectOn } from "../../hooks/effects";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { showNoticeNotification } from "../../states/notifications";
import { getTheme } from "../../states/theme";
import { FavIcon } from "./FavIcon";

export function Theme(): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [styleRef, styleEl] = useRefWithUtils<HTMLStyleElement>();
  const [linkRef, linkEl] = useRefWithUtils<HTMLLinkElement>();

  //Use memo to ignore signals without changes, needed for the css loading
  const getThemeName = createMemo(() => getTheme().name);

  const onLoad = (e: Event): void => {
    hideLoaderBar();
    const target = e.target as HTMLLinkElement;
    if (target.href !== "") {
      console.debug(
        `Theme component loaded style for theme ${target.dataset["name"]}`,
      );
    }
  };

  const onError = (e: Event): void => {
    hideLoaderBar();
    const target = e.target as HTMLLinkElement;
    const name = target.dataset["name"];
    console.debug("Theme component failed to load style", name, e);
    console.error(`Failed to load theme ${name}`, e);
    showNoticeNotification("Failed to load theme");
  };

  const applyThemeColors = (colors: ReturnType<typeof getTheme>): void => {
    const css = `
:root {
    --bg-color: ${colors.bg};
    --main-color: ${colors.main};
    --caret-color: ${colors.caret};
    --sub-color: ${colors.sub};
    --sub-alt-color: ${colors.subAlt};
    --text-color: ${colors.text};
    --error-color: ${colors.error};
    --error-extra-color: ${colors.errorExtra};
    --colorful-error-color: ${colors.colorfulError};
    --colorful-error-extra-color: ${colors.colorfulErrorExtra};
}`;

    if (envConfig.isDesktop) {
      const rootStyle = document.documentElement.style;
      // WKWebView can retain individual fallback custom properties from the
      // desktop head during startup. Keep the runtime theme authoritative so
      // every token changes together instead of leaving a mixed theme behind.
      rootStyle.setProperty("--bg-color", colors.bg, "important");
      rootStyle.setProperty("--main-color", colors.main, "important");
      rootStyle.setProperty("--caret-color", colors.caret, "important");
      rootStyle.setProperty("--sub-color", colors.sub, "important");
      rootStyle.setProperty("--sub-alt-color", colors.subAlt, "important");
      rootStyle.setProperty("--text-color", colors.text, "important");
      rootStyle.setProperty("--error-color", colors.error, "important");
      rootStyle.setProperty(
        "--error-extra-color",
        colors.errorExtra,
        "important",
      );
      rootStyle.setProperty(
        "--colorful-error-color",
        colors.colorfulError,
        "important",
      );
      rootStyle.setProperty(
        "--colorful-error-extra-color",
        colors.colorfulErrorExtra,
        "important",
      );
    } else {
      styleEl()?.setHtml(css);
    }
  };

  if (envConfig.isDesktop) {
    // The Tauri window starts hidden. WKWebView can suspend a debounced timer
    // before the window is revealed, leaving the fallback Serika colors in
    // place even though the selected theme and theme indicator are correct.
    createEffectOn(getTheme, applyThemeColors);
  } else {
    createDebouncedEffectOn(125, getTheme, applyThemeColors);
  }

  const isThemeWithCss = () => {
    const name = getThemeName();
    return name !== "custom" && (themes[name]?.hasCss ?? false);
  };

  createEffect(() => {
    const name = getThemeName();
    const hasCss = isThemeWithCss();

    console.debug(
      `Theme component ${hasCss ? "loading style" : "removing style"} for theme ${name}`,
    );
    if (hasCss) {
      showLoaderBar();
    } else {
      hideLoaderBar();
    }
    if (envConfig.isDesktop) {
      const existing =
        document.head.querySelector<HTMLLinkElement>("#currentTheme");
      if (!hasCss) {
        existing?.remove();
        hideLoaderBar();
      } else {
        const link = existing ?? document.createElement("link");
        link.id = "currentTheme";
        link.rel = "stylesheet";
        if (existing === null) {
          link.addEventListener("load", onLoad);
          link.addEventListener("error", onError);
        }
        link.dataset["name"] = name;
        link.href = `/themes/${name}.css`;
        if (existing === null) document.head.append(link);
      }

      const meta =
        document.head.querySelector<HTMLMetaElement>("#metaThemeColor");
      meta?.setAttribute("content", getTheme().bg);
    } else {
      linkEl()?.setAttribute("href", hasCss ? `/themes/${name}.css` : "");
    }
  });

  return (
    <MetaProvider>
      <Show when={!envConfig.isDesktop}>
        <Style id="theme" ref={styleRef} />
      </Show>
      <Show when={!envConfig.isDesktop && isThemeWithCss()}>
        <Link
          ref={linkRef}
          rel="stylesheet"
          id="currentTheme"
          data-name={getTheme().name}
          onError={onError}
          onLoad={onLoad}
        />
      </Show>
      <Meta id="metaThemeColor" name="theme-color" content={getTheme().bg} />
      <FavIcon theme={getTheme()} />
    </MetaProvider>
  );
}
