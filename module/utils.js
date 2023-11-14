/** @typedef {import("./index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

/** @param {BridgeModuleOptions} [options] */
export const resolveModuleOptions = (
  options = { bridgeWorkerOrigin: "http://127.0.0.1:8787" },
) => {
  if ("fetchImpl" in options)
    return {
      fetchImpl: options.fetchImpl,
      bridgeWorkerOrigin: "//fake-host",
    };

  return {
    fetchImpl: fetch,
    bridgeWorkerOrigin: options.bridgeWorkerOrigin,
  };
};
