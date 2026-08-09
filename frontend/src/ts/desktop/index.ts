import "../dev/signal-tracker";
import "solid-devtools";
import "../event-handlers/global";
import "../event-handlers/test";
import "../ui";
import "../input/listeners";
import "./route-controller";
import "../elements/no-css";
import "../test/tts";
import "../input/hotkeys";
import "../../styles/desktop.scss";

import { applyEngineSettings } from "../anim";
import { loadFromLocalStorage } from "../config/lifecycle";
import { mountDesktopComponents } from "./mount";
import "./ready";

Object.defineProperty(Math, "random", {
  value: Math.random,
  writable: false,
  configurable: false,
  enumerable: true,
});
Object.freeze(Math);
Object.defineProperty(window, "Math", {
  value: Math,
  writable: false,
  configurable: false,
  enumerable: true,
});

applyEngineSettings();
void loadFromLocalStorage();
mountDesktopComponents();
