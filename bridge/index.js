// @ts-check
import { KVBridgeModule } from "./kv.js";
import { ServiceBridgeModule, ServiceBridgeModuleDirect } from "./service.js";
import { R2BridgeModule } from "./r2.js";

/** @param {string} [bridgeWranglerOrigin] */
export const createBridge = (
  bridgeWranglerOrigin = "http://127.0.0.1:8787"
) => ({
  /** @param {string} bindingName */
  KV: (bindingName) => new KVBridgeModule(bridgeWranglerOrigin, bindingName),

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
      ? new ServiceBridgeModuleDirect(serviceWranglerOrigin)
      : new ServiceBridgeModule(bridgeWranglerOrigin, bindingName),

  /** @param {string} bindingName */
  R2: (bindingName) => new R2BridgeModule(bridgeWranglerOrigin, bindingName),
});
