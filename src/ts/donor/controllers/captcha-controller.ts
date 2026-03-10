// DESKTOP: No-op captcha stub — no reCAPTCHA in desktop app
export async function verify(_action: string): Promise<string> { return ""; }
export function render(_element: HTMLElement, _id: string, _siteKey?: string): void {}
export function reset(): void {}
export function getResponse(): string { return ""; }
