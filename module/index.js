// @ts-check
import { KVNamespace$ } from "./kv/index.js";
import { Fetcher$, DirectFetcher$ } from "./service/index.js";
import { R2Bucket$ } from "./r2/index.js";
import { D1Database$ } from "./d1/index.js";
import { WorkerQueue$ } from "./queue/index.js";
import { VectorizeIndex$ } from "./vectorize/index.js";
import { getBindings } from "./_internals/index.js";

const DEFAULT_BRIDGE_WRANGLER_ORIGIN = "http://127.0.0.1:8787";

/** @param {string} [bridgeWranglerOrigin] */
export const createBridge = (bridgeWranglerOrigin = DEFAULT_BRIDGE_WRANGLER_ORIGIN) => ({
  getBindings: () => getBindings(bridgeWranglerOrigin),

  /** @param {string} bindingName */
  KVNamespace: (bindingName) =>
    new KVNamespace$(bridgeWranglerOrigin, bindingName),

  /**
   * @param {string} bindingName
   * @param {string} [serviceWranglerOrigin]
   */
  Fetcher: (bindingName, serviceWranglerOrigin) =>
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
  R2Bucket: (bindingName) => new R2Bucket$(bridgeWranglerOrigin, bindingName),

  /** @param {string} bindingName */
  D1Database: (bindingName) =>
    new D1Database$(bridgeWranglerOrigin, bindingName),

  /** @param {string} bindingName */
  Queue: (bindingName) => new WorkerQueue$(bridgeWranglerOrigin, bindingName),

  /** @param {string} bindingName */
  VectorizeIndex: (bindingName) =>
    new VectorizeIndex$(bridgeWranglerOrigin, bindingName),
});
