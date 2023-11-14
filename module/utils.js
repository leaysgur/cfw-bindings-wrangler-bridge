/** @typedef {import("./index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

/** @param {BridgeModuleOptions} [options] */
export const resolveModuleOptions = (
  options = { bridgeWorkerOrigin: "http://127.0.0.1:8787" },
) => {
  // `fetch` for `UnstableDevWorker`
  // Do not hold `UnstableDevWorker` itself, `wrangler` package depends on Node.js
  if ("fetchImpl" in options)
    return {
      fetchImpl: options.fetchImpl,
      bridgeWorkerOrigin: "https://fake-host",
    };

  // `fetch` for external `wrangler dev` process
  return {
    fetchImpl: fetch,
    bridgeWorkerOrigin: options.bridgeWorkerOrigin,
  };
};
