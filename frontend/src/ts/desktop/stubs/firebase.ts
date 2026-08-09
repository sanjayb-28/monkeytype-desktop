import { promiseWithResolvers } from "../../utils/misc";

const { promise: authPromise, resolve } = promiseWithResolvers();
resolve();

export async function init(
  callback: (success: boolean, user: null) => Promise<void>,
): Promise<void> {
  await callback(false, null);
}
export function getAuthenticatedUser(): null {
  return null;
}
export function getAnalytics(): never {
  throw new Error("Analytics are unavailable in the desktop app");
}
export function isAuthAvailable(): boolean {
  return false;
}
export async function signOut(): Promise<void> {
  return undefined;
}
export async function signInWithEmailAndPassword(): Promise<never> {
  throw new Error("Accounts are unavailable in the desktop app");
}
export async function signInWithPopup(): Promise<never> {
  throw new Error("Accounts are unavailable in the desktop app");
}
export async function createUserWithEmailAndPassword(): Promise<never> {
  throw new Error("Accounts are unavailable in the desktop app");
}
export async function getIdToken(): Promise<null> {
  return null;
}
export function resetIgnoreAuthCallback(): void {
  return;
}
export { authPromise };
