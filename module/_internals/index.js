// @ts-check
import { KVNamespace$ } from "../kv/index.js";
import { Fetcher$ } from "../service/index.js";
import { R2Bucket$ } from "../r2/index.js";
import { D1Database$ } from "../d1/index.js";
import { WorkerQueue$ } from "../queue/index.js";
import { VectorizeIndex$ } from "../vectorize/index.js";

/**
 * @param {string} origin
 * @param {typeof fetch} fetchImpl
 */
export const getBindings = async (origin, fetchImpl) => {
  const res = await fetchImpl(origin, {
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
      bindings[bindingName] = new D1Database$(origin, bindingName, fetchImpl);
    if (type === "kv")
      bindings[bindingName] = new KVNamespace$(origin, bindingName, fetchImpl);
    if (type === "queue")
      bindings[bindingName] = new WorkerQueue$(origin, bindingName, fetchImpl);
    if (type === "r2")
      bindings[bindingName] = new R2Bucket$(origin, bindingName, fetchImpl);
    // XXX: How to handle each origin for DirectFetcher$...?
    if (type === "service")
      bindings[bindingName] = new Fetcher$(origin, bindingName, fetchImpl);
    if (type === "vectorize")
      bindings[bindingName] = new VectorizeIndex$(
        origin,
        bindingName,
        fetchImpl,
      );
  }

  return bindings;
};
