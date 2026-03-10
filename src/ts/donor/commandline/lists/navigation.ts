import { navigate } from "../../controllers/route-controller";
import { toggleFullscreen } from "../../utils/misc";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "viewTypingPage",
    display: "View Typing Page",
    alias: "navigate go to start begin type test",
    icon: "fa-keyboard",
    exec: (): void => {
      void navigate("/");
    },
  },
  {
    id: "viewAbout",
    display: "View About Page",
    alias: "navigate go to",
    icon: "fa-info",
    exec: (): void => {
      void navigate("/about");
    },
  },
  {
    id: "viewSettings",
    display: "View Settings Page",
    alias: "navigate go to",
    icon: "fa-cog",
    exec: (): void => {
      void navigate("/settings");
    },
  },

  {
    id: "toggleFullscreen",
    display: "Toggle Fullscreen",
    icon: "fa-expand",
    exec: (): void => {
      toggleFullscreen();
    },
  },
];

export default commands;
