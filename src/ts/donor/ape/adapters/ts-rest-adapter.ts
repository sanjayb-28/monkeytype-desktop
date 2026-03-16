// No-op stub
export function buildClient(_contract: unknown, _baseUrl: string, _timeout: number): unknown {
  return new Proxy({}, { get: () => () => Promise.resolve({ status: 200, body: { message: "", data: null } }) });
}
export const lastSeenServerCompatibility: { value: unknown } = { value: null };
