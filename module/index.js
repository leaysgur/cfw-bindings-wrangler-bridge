// @ts-check
import { KVNamespace$ } from "./kv/index.js";
import { Fetcher$, DirectFetcher$ } from "./service/index.js";
import { R2Bucket$ } from "./r2/index.js";
import { D1Database$ } from "./d1/index.js";
import { WorkerQueue$ } from "./queue/index.js";
import { VectorizeIndex$ } from "./vectorize/index.js";
import { getBindings } from "./_internals/index.js";

/**
 * @param {string} [bridgeWranglerOrigin]
 * @param {typeof fetch} [fetchImpl]
 */
export const createBridge = (
  bridgeWranglerOrigin = "http://127.0.0.1:8787",
  fetchImpl = fetch,
) => ({
  getBindings: () => getBindings(bridgeWranglerOrigin, fetchImpl),

  /** @param {string} bindingName */
  KVNamespace: (bindingName) =>
    new KVNamespace$(bridgeWranglerOrigin, bindingName, fetchImpl),

  /**
   * @param {string} bindingName
   * @param {string} [serviceWranglerOrigin]
   */
  Fetcher: (bindingName, serviceWranglerOrigin) =>
    // Current `wrangler dev` cannot mix `--local` and `--remote` workers.
    // https://github.com/cloudflare/workers-sdk/issues/1182
    //
    // If worker runs in `--local`,
    //   it is allowed to call service(worker) running in local.
    // If worker runs in `--remote`,
    //   it is allowed to call service(worker) actually deployed.
    // (There is no ways to call service(worker) running with `dev --remote`!)
    //
    // But using this bridge makes it possible by calling service(worker) directly!
    serviceWranglerOrigin
      ? new DirectFetcher$(serviceWranglerOrigin, fetchImpl)
      : new Fetcher$(bridgeWranglerOrigin, bindingName, fetchImpl),

  /** @param {string} bindingName */
  R2Bucket: (bindingName) =>
    new R2Bucket$(bridgeWranglerOrigin, bindingName, fetchImpl),

  /** @param {string} bindingName */
  D1Database: (bindingName) =>
    new D1Database$(bridgeWranglerOrigin, bindingName, fetchImpl),

  /** @param {string} bindingName */
  Queue: (bindingName) =>
    new WorkerQueue$(bridgeWranglerOrigin, bindingName, fetchImpl),

  /** @param {string} bindingName */
  VectorizeIndex: (bindingName) =>
    new VectorizeIndex$(bridgeWranglerOrigin, bindingName, fetchImpl),
});
