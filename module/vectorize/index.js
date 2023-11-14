// @ts-check

// Refs:
// https://developers.cloudflare.com/vectorize/platform/client-api/
// https://github.com/cloudflare/workerd/blob/main/src/cloudflare/internal/vectorize-api.ts
// https://github.com/cloudflare/workerd/blob/main/src/cloudflare/internal/vectorize.d.ts

import { stringify } from "devalue";
import { resolveModuleOptions } from "../options.js";
/** @typedef {import("../index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

export class VectorizeIndex$ {
  #bindingName;
  #bridgeWorkerOrigin;

  /**
   * @param {string} bindingName
   * @param {BridgeModuleOptions} [options]
   */
  constructor(bindingName, options) {
    this.#bindingName = bindingName;

    const { bridgeWorkerOrigin } = resolveModuleOptions(options);
    this.#bridgeWorkerOrigin = bridgeWorkerOrigin;
  }

  /**
   * @param {string} operation
   * @param {unknown[]} parameters
   */
  async #dispatch(operation, parameters) {
    const res = await fetch(this.#bridgeWorkerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-BINDING-MODULE": "VECTORIZE",
        "X-BRIDGE-BINDING-NAME": this.#bindingName,
      },
      body: stringify({ operation, parameters }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return res;
  }

  async describe() {
    const res = await this.#dispatch("VectorizeIndex.describe", []);
    const json = await res.json();

    return json;
  }

  /**
   * @param {import("@cloudflare/workers-types/experimental").VectorFloatArray | number[]} vector
   * @param {import("@cloudflare/workers-types/experimental").VectorizeQueryOptions} options
   */
  async query(vector, options) {
    const res = await this.#dispatch("VectorizeIndex.query", [vector, options]);
    const json = await res.json();

    return json;
  }

  /** @param {import("@cloudflare/workers-types/experimental").VectorizeVector[]} vectors */
  async insert(vectors) {
    const res = await this.#dispatch("VectorizeIndex.insert", [vectors]);
    const json = await res.json();

    return json;
  }

  /** @param {import("@cloudflare/workers-types/experimental").VectorizeVector[]} vectors */
  async upsert(vectors) {
    const res = await this.#dispatch("VectorizeIndex.upsert", [vectors]);
    const json = await res.json();

    return json;
  }

  /** @param {string[]} ids */
  async deleteByIds(ids) {
    const res = await this.#dispatch("VectorizeIndex.deleteByIds", [ids]);
    const json = await res.json();

    return json;
  }

  /** @param {string[]} ids */
  async getByIds(ids) {
    const res = await this.#dispatch("VectorizeIndex.getByIds", [ids]);
    const json = await res.json();

    return json;
  }
}
