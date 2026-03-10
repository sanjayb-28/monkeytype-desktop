// DESKTOP: No-op connection state — always offline in local app
export function getStatus(): string { return "offline"; }
export function get(): string { return "offline"; }
export function isOnline(): boolean { return false; }
export function showOfflineBanner(): void {}
export function hideOfflineBanner(): void {}
