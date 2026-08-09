import { openDB, DBSchema, IDBPDatabase } from "idb";
import { createSignal } from "solid-js";

type FileDB = DBSchema & {
  files: {
    key: string; // filename
    value: string; // the data url
  };
};

export type Filename = "LocalBackgroundFile" | "LocalFontFamilyFile";
export type StoredFiles = Partial<Record<Filename, string>>;

class FileStorage {
  private dbPromise: Promise<IDBPDatabase<FileDB>>;
  private signals = new Map<
    Filename,
    [get: () => number, set: (v: number | ((prev: number) => number)) => void]
  >();

  constructor(dbName = "file-storage-db") {
    this.dbPromise = openDB<FileDB>(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files");
        }
      },
    });
  }

  private getSignal(
    filename: Filename,
  ): [
    get: () => number,
    set: (v: number | ((prev: number) => number)) => void,
  ] {
    let signal = this.signals.get(filename);
    if (!signal) {
      signal = createSignal(0);
      this.signals.set(filename, signal);
    }
    return signal;
  }

  private notify(filename: Filename): void {
    const signal = this.signals.get(filename);
    if (signal) {
      signal[1]((v) => v + 1);
    }
  }

  /** Subscribe to changes for a filename. Call within a reactive context. Returns a version number. */
  track(filename: Filename): number {
    return this.getSignal(filename)[0]();
  }

  async storeFile(filename: Filename, dataUrl: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put("files", dataUrl, filename);
    this.notify(filename);
  }

  async getFile(filename: Filename): Promise<string | undefined> {
    const db = await this.dbPromise;
    return db.get("files", filename);
  }

  async deleteFile(filename: Filename): Promise<void> {
    const db = await this.dbPromise;
    await db.delete("files", filename);
    this.notify(filename);
  }

  async listFilenames(): Promise<Filename[]> {
    const db = await this.dbPromise;
    return db.getAllKeys("files") as Promise<Filename[]>;
  }

  async hasFile(filename: Filename): Promise<boolean> {
    return (await this.getFile(filename)) !== undefined;
  }

  async getAllFiles(): Promise<StoredFiles> {
    const files: StoredFiles = {};
    for (const filename of await this.listFilenames()) {
      files[filename] = await this.getFile(filename);
    }
    return files;
  }

  async replaceFiles(files: StoredFiles): Promise<void> {
    const filenames: Filename[] = [
      "LocalBackgroundFile",
      "LocalFontFamilyFile",
    ];
    const db = await this.dbPromise;
    const transaction = db.transaction("files", "readwrite");
    for (const filename of filenames) {
      const value = files[filename];
      if (value === undefined) {
        await transaction.store.delete(filename);
      } else {
        await transaction.store.put(value, filename);
      }
    }
    await transaction.done;
    for (const filename of filenames) this.notify(filename);
  }
}

export default new FileStorage();
