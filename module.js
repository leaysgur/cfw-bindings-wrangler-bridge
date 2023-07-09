// @ts-check
import { KVNamespace$ } from "./src/kv/module.js";
import { Fetcher$, DirectFetcher$ } from "./src/service/module.js";
import { R2Bucket$ } from "./src/r2/module/index.js";

/** @param {string} [bridgeWranglerOrigin] */
export const createBridge = (
  bridgeWranglerOrigin = "http://127.0.0.1:8787"
) => ({
  /** @param {string} bindingName */
  KV: (bindingName) => new KVNamespace$(bridgeWranglerOrigin, bindingName),

  /**
   * @param {string} bindingName
   * @param {string} [serviceWranglerOrigin]
   */
  SERVICE: (bindingName, serviceWranglerOrigin) =>
    // Current `wrangler dev` cannot mix `--local` and `--remote` workers.
    // https://github.com/cloudflare/workers-sdk/issues/1182
    //
    // If bridge(worker) runs in `--local`,
    //   it is allowed to call service(worker) running in local.
    // If bridge(worker) runs in `--remote`,
    //   it is allowed to call service(worker) actually deployed.
    // (There is no ways to call service(worker) running with `dev --remote`.)
    //
    // But with our bridge, it is possible to mix them by calling service(worker) directly!
    serviceWranglerOrigin
      ? new DirectFetcher$(serviceWranglerOrigin)
      : new Fetcher$(bridgeWranglerOrigin, bindingName),

  /** @param {string} bindingName */
  R2: (bindingName) => new R2Bucket$(bridgeWranglerOrigin, bindingName),
});
