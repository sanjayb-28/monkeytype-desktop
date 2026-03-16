// No-op Firebase stub. All auth functions return false/null/resolved.
// This file is aliased via Vite resolve.alias to replace the original firebase.ts

export async function init(
  _callback: (success: boolean, user: null) => Promise<void>
): Promise<void> {
  // No Firebase in desktop app — immediately signal "no user"
  await _callback(false, null);
}

export function isAuthenticated(): boolean {
  return false;
}

export function isAuthAvailable(): boolean {
  return false;
}

export function getAuthenticatedUser(): null {
  return null;
}

export async function signOut(): Promise<void> {
  // no-op
}

export async function signInWithEmailAndPassword(
  _email: string,
  _password: string
): Promise<null> {
  return null;
}

export async function signInWithPopup(
  _provider: unknown
): Promise<null> {
  return null;
}

export async function createUserWithEmailAndPassword(
  _email: string,
  _password: string
): Promise<null> {
  return null;
}

export async function getIdToken(): Promise<string> {
  return "";
}

export async function setPersistence(
  _rememberMe: boolean,
  _store?: boolean
): Promise<void> {
  // no-op
}

export function resetIgnoreAuthCallback(): void {
  // no-op
}

export const authPromise: Promise<void> = Promise.resolve();
