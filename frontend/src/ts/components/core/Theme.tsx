import { Link, Meta, MetaProvider, Style } from "@solidjs/meta";
import { createEffect, createMemo, JSXElement, Show } from "solid-js";
import { envConfig } from "virtual:env-config";

import { themes } from "../../constants/themes";
import { createDebouncedEffectOn } from "../../hooks/effects";
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

  createDebouncedEffectOn(125, getTheme, (colors) => {
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
      rootStyle.setProperty("--bg-color", colors.bg);
      rootStyle.setProperty("--main-color", colors.main);
      rootStyle.setProperty("--caret-color", colors.caret);
      rootStyle.setProperty("--sub-color", colors.sub);
      rootStyle.setProperty("--sub-alt-color", colors.subAlt);
      rootStyle.setProperty("--text-color", colors.text);
      rootStyle.setProperty("--error-color", colors.error);
      rootStyle.setProperty("--error-extra-color", colors.errorExtra);
      rootStyle.setProperty("--colorful-error-color", colors.colorfulError);
      rootStyle.setProperty(
        "--colorful-error-extra-color",
        colors.colorfulErrorExtra,
      );
    } else {
      styleEl()?.setHtml(css);
    }
  });

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
