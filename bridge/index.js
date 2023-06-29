// @ts-check
import { KVBridge } from "./kv.js";
import { ServiceBridge, ServiceBridgeDirect } from "./service.js";
import { R2Bridge } from "./r2.js";

/** @param {string} bridgeWranglerOrigin */
export const createBridge = (bridgeWranglerOrigin) => ({
  /** @param {string} bindingName */
  KV: (bindingName) => new KVBridge(bridgeWranglerOrigin, bindingName),

  /**
   * @param {string} bindingName
   * @param {string} [serviceWranglerOrigin]
   */
  SERVICE: (bindingName, serviceWranglerOrigin) =>
    // Current `wrangler dev` cannot mix `--local` and `--remote` workers.
    // https://github.com/cloudflare/workers-sdk/issues/1182
    //
    // If bride(worker) runs in `--local`, it calls service(worker) running in local.
    // If bride(worker) runs in `--remote`, it calls service(worker) actually deployed.(NOT `dev --remote`!)
    //
    // But our brige make it possible to mix them by calling service(worker) directly!
    serviceWranglerOrigin
      ? new ServiceBridgeDirect(serviceWranglerOrigin)
      : new ServiceBridge(bridgeWranglerOrigin, bindingName),

  /** @param {string} bindingName */
  R2: (bindingName) => new R2Bridge(bridgeWranglerOrigin, bindingName),
});
