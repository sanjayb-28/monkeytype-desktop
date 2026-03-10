// DESKTOP: Stub for firebase/auth — provides type-compatible no-ops
export class EmailAuthProvider {
  static credential(_email: string, _password: string): unknown { return {}; }
}
export class GoogleAuthProvider {}
export class GithubAuthProvider {}
export type UserCredential = { user: unknown };
export type AuthCredential = unknown;
export function reauthenticateWithCredential(_user: unknown, _credential: unknown): Promise<unknown> { return Promise.resolve({}); }
export function reauthenticateWithPopup(_user: unknown, _provider: unknown): Promise<unknown> { return Promise.resolve({}); }
export function unlink(_user: unknown, _providerId: string): Promise<unknown> { return Promise.resolve({}); }
export function linkWithPopup(_user: unknown, _provider: unknown): Promise<unknown> { return Promise.resolve({}); }
export function updateEmail(_user: unknown, _email: string): Promise<void> { return Promise.resolve(); }
export function updatePassword(_user: unknown, _password: string): Promise<void> { return Promise.resolve(); }
export function sendEmailVerification(_user: unknown): Promise<void> { return Promise.resolve(); }
export function deleteUser(_user: unknown): Promise<void> { return Promise.resolve(); }
export function updateProfile(_user: unknown, _profile: unknown): Promise<void> { return Promise.resolve(); }
export function getAdditionalUserInfo(_credential: unknown): unknown { return null; }
export function linkWithCredential(_user: unknown, _credential: unknown): Promise<unknown> { return Promise.resolve({}); }
export function signInWithCredential(_auth: unknown, _credential: unknown): Promise<unknown> { return Promise.resolve({}); }
