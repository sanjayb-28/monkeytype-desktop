import { createHotkeySequence } from "@tanstack/solid-hotkeys";
import { envConfig } from "virtual:env-config";

createHotkeySequence(
  [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "B",
    "A",
  ],
  () => {
    if (!envConfig.isDesktop) {
      window.open("https://keymash.io/", "_blank");
    }
  },
);
