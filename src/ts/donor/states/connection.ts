// No-op stub — always offline
export function getStatus(): string { return "offline"; }
export function get(): string { return "offline"; }
export function isOnline(): boolean { return false; }
export function showOfflineBanner(): void {}
export function hideOfflineBanner(): void {}
