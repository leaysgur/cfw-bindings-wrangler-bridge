// @ts-check
import { KVNamespace$ } from "../kv/module.js";
import { Fetcher$ } from "../service/module.js";
import { R2Bucket$ } from "../r2/module/index.js";
import { D1Database$ } from "../d1/module/index.js";
import { WorkerQueue$ } from "../queue/module.js";
import { VectorizeIndex$ } from "../vectorize/module.js";

/** @param {string} wranglerOrigin */
export const getBindings = async (wranglerOrigin) => {
  const url = new URL("/_internals/getBindings", wranglerOrigin);

  const res = await fetch(url, {
    headers: { "content-type": "application/json" },
  });
  const env = await res.json();

  /** @type {Record<string, any>} */
  const bindings = {};
  for (const [bindingName, type] of Object.entries(env)) {
    if (type === "d1")
      bindings[bindingName] = new D1Database$(wranglerOrigin, bindingName);
    if (type === "kv")
      bindings[bindingName] = new KVNamespace$(wranglerOrigin, bindingName);
    if (type === "queue")
      bindings[bindingName] = new WorkerQueue$(wranglerOrigin, bindingName);
    if (type === "r2")
      bindings[bindingName] = new R2Bucket$(wranglerOrigin, bindingName);
    // XXX: How to handle each origin for DirectFetcher$...?
    if (type === "service")
      bindings[bindingName] = new Fetcher$(wranglerOrigin, bindingName);
    if (type === "vectorize")
      bindings[bindingName] = new VectorizeIndex$(wranglerOrigin, bindingName);
  }

  return bindings;
};
