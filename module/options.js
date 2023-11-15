/** @typedef {import("./index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

/** @param {BridgeModuleOptions} [options] */
export const resolveModuleOptions = (options) => ({
  bridgeWorkerOrigin: options?.bridgeWorkerOrigin ?? "http://127.0.0.1:8787",
});
