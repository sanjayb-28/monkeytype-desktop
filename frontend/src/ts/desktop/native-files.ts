import { invoke } from "@tauri-apps/api/core";

const isTauri = (): boolean => "__TAURI_INTERNALS__" in window;

export async function saveTextFile(
  suggestedName: string,
  contents: string,
  contentType: string,
): Promise<boolean> {
  if (isTauri()) {
    return invoke<boolean>("save_text_file", { suggestedName, contents });
  }

  const url = URL.createObjectURL(new Blob([contents], { type: contentType }));
  const anchor = document.createElement("a");
  anchor.download = suggestedName;
  anchor.href = url;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return true;
}

export async function openTextFile(): Promise<string | null> {
  if (isTauri()) return invoke<string | null>("open_text_file");

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0];
        if (file === undefined) {
          resolve(null);
          return;
        }
        void file.text().then(resolve);
      },
      { once: true },
    );
    input.click();
  });
}
