// No-op API client stub. All API calls resolve with empty success responses.
// This file is aliased via Vite resolve.alias to replace the original ape/index.ts

type ApeResponse = {
  status: 200;
  body: { message: string; data: unknown };
};

const successResponse: ApeResponse = {
  status: 200,
  body: { message: "", data: null },
};

const noopEndpoint = (): Promise<ApeResponse> => Promise.resolve(successResponse);

// Proxy that returns noopEndpoint for any property access, supporting nested access
// e.g., Ape.results.save() → noopEndpoint()
// e.g., Ape.users.get() → noopEndpoint()
function createNoopProxy(): unknown {
  return new Proxy(noopEndpoint, {
    get(_target, _prop) {
      return createNoopProxy();
    },
    apply() {
      return Promise.resolve(successResponse);
    },
  });
}

const Ape = createNoopProxy() as Record<string, Record<string, (...args: unknown[]) => Promise<ApeResponse>>>;

export default Ape;
