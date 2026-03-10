import { z } from "zod";

import { addBanner } from "../stores/banners";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const closed = new LocalStorageWithSchema({
  key: "merchBannerClosed3",
  schema: z.boolean(),
  fallback: false,
});

export function showIfNotClosedBefore(): void {
  // DESKTOP: No merch banner in desktop app
}
