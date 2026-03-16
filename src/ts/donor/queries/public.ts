// No-op stub — all query options return empty data
const noop = (key: string, data: unknown = null) => ({ queryKey: [key], queryFn: () => data });
export function useSupporters(): unknown { return { data: [], isLoading: false }; }
export function useContributors(): unknown { return { data: [], isLoading: false }; }
export function getContributorsQueryOptions(): unknown { return noop("contributors", []); }
export function getSupportersQueryOptions(): unknown { return noop("supporters", []); }
export function getTypingStatsQueryOptions(): unknown { return noop("typingStats", {}); }
export function getSpeedHistogramQueryOptions(): unknown { return noop("speedHistogram", []); }
