// @ts-check
import { KVNamespace$ } from "../kv/index.js";
import { Fetcher$ } from "../service/index.js";
import { R2Bucket$ } from "../r2/index.js";
import { D1Database$ } from "../d1/index.js";
import { WorkerQueue$ } from "../queue/index.js";
import { VectorizeIndex$ } from "../vectorize/index.js";
import { resolveModuleOptions } from "../utils.js";
/** @typedef {import("../index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

/** @param {BridgeModuleOptions} [options] */
export const getBindings = async (options) => {
  const { fetchImpl, bridgeWorkerOrigin } = resolveModuleOptions(options);

  const res = await fetchImpl(bridgeWorkerOrigin, {
    headers: {
      "X-BRIDGE-INTERNALS": "getBindings",
      "content-type": "application/json",
    },
  });
  const env = /** @type {Record<string, string>} */ (await res.json());

  /** @type {Record<string, any>} */
  const bindings = {};
  for (const [bindingName, type] of Object.entries(env)) {
    if (type === "d1")
      bindings[bindingName] = new D1Database$(bindingName, options);
    if (type === "kv")
      bindings[bindingName] = new KVNamespace$(bindingName, options);
    if (type === "queue")
      bindings[bindingName] = new WorkerQueue$(bindingName, options);
    if (type === "r2")
      bindings[bindingName] = new R2Bucket$(bindingName, options);
    if (type === "service")
      bindings[bindingName] = new Fetcher$(bindingName, options);
    if (type === "vectorize")
      bindings[bindingName] = new VectorizeIndex$(bindingName, options);
  }

  return bindings;
};
