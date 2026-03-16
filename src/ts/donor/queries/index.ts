// No-op query client stub
import { QueryClient } from "@tanstack/solid-query";
export function createQueryClientProvider(): unknown { return {}; }
export const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
});
