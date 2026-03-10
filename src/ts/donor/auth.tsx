// DESKTOP: No-op auth stub
export function onAuthStateChanged(): void {}
export async function signOut(): Promise<void> {}
export async function signIn(): Promise<void> {}
export function isAuthenticated(): boolean { return false; }
export function getAuthenticatedUser(): null { return null; }
export const gmailProvider = {};
export const githubProvider = {};
