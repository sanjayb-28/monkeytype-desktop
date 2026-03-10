import { JSXElement } from "solid-js";

import { getActivePage, getFocus } from "../../../signals/core";
import {
  getAnimatedLevel,
  setAnimatedLevel,
} from "../../../signals/header";
import * as DB from "../../../db";
import { restart } from "../../../test/test-logic";
import { cn } from "../../../utils/cn";
import { getLevelFromTotalXp } from "../../../utils/levels";
import { createEffectOn } from "../../../hooks/effects";
import { Button } from "../../common/Button";
import { User } from "../../common/User";
import { AccountXpBar } from "./AccountXpBar";

export function Nav(): JSXElement {
  const buttonClass = () =>
    cn("aspect-square", {
      "opacity-(--nav-focus-opacity)": getFocus(),
    });

  // Keep animated level in sync with local XP
  createEffectOn(
    () => DB.getSnapshot()?.xp,
    (xp) => {
      if (xp === undefined) {
        setAnimatedLevel(0);
        return;
      }
      setAnimatedLevel(getLevelFromTotalXp(xp));
    },
  );

  return (
    <nav class={cn("z-5 flex w-full items-center gap-1 md:gap-2")}>
      <Button
        variant="text"
        fa={{
          icon: "fa-keyboard",
          fixedWidth: true,
        }}
        router-link
        href="/"
        class={buttonClass()}
        dataset={{
          "data-nav-item": "test",
        }}
        onClick={() => {
          if (getActivePage() === "test") restart();
        }}
      />
      <Button
        variant="text"
        fa={{
          icon: "fa-info",
          fixedWidth: true,
        }}
        class={buttonClass()}
        dataset={{
          "data-nav-item": "about",
        }}
        href="/about"
        router-link
      />
      <Button
        variant="text"
        fa={{
          icon: "fa-cog",
          fixedWidth: true,
        }}
        class={buttonClass()}
        href="/settings"
        dataset={{
          "data-nav-item": "settings",
        }}
        router-link
      />
      <div class="grow"></div>
      <div class="relative">
        <Button
          variant="text"
          class={cn("h-full", "hover:**:data-[ui-element='userLevel']:bg-(--themable-button-hover-text)", {
            "opacity-(--nav-focus-opacity)": getFocus(),
          })}
          href="/account"
          router-link
          dataset={{
            "data-nav-item": "account",
          }}
        >
          <User
            name="Monkey"
            hideNameOnSmallScreens={true}
            level={getAnimatedLevel()}
            fontClass="text-em-xs"
          />
        </Button>
        <div class="relative">
          <AccountXpBar />
        </div>
      </div>
    </nav>
  );
}
