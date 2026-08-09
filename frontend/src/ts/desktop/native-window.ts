import { invoke } from "@tauri-apps/api/core";

const isTauri = (): boolean => "__TAURI_INTERNALS__" in window;

export async function showMainWindow(): Promise<void> {
  if (isTauri()) await invoke("show_main_window");
}

export function reloadDesktopApp(): void {
  window.location.replace("/desktop.html");
}
