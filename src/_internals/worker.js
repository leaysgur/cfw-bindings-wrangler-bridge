// @ts-check
import { isD1Binding } from "../d1/worker.js";
import { isKVBinding } from "../kv/worker.js";
import { isQueueBinding } from "../queue/worker.js";
import { isR2Binding } from "../r2/worker.js";
import { isServiceBinding } from "../service/worker.js";
import { isVectorizeBinding } from "../vectorize/worker.js";

/** @param {Record<string, unknown>} env */
export const getBindings = (env) => {
  /** @type {Record<string, string>} */
  const bindings = {};

  for (const [name, binding] of Object.entries(env)) {
    if (isD1Binding(binding)) bindings[name] = "d1";
    if (isKVBinding(binding)) bindings[name] = "kv";
    if (isQueueBinding(binding)) bindings[name] = "queue";
    if (isR2Binding(binding)) bindings[name] = "r2";
    if (isServiceBinding(binding)) bindings[name] = "service";
    if (isVectorizeBinding(binding)) bindings[name] = "vectorize";
  }

  return bindings;
};
