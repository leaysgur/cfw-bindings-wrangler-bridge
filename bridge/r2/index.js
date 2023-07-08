// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-bucket.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/bucket.ts

import { R2Object$, R2ObjectBody$ } from "./r2-object.js";
/**
 * @typedef {import("./r2-object.js").R2ObjectJSON} R2ObjectJSON
 * @typedef {import("./r2-object.js").R2ObjectsJSON} R2ObjectsJSON
 */

export class R2Bucket$ {
  #bridgeWranglerOrigin;
  #bindingName;

  /**
   * @param {string} origin
   * @param {string} bindingName
   */
  constructor(origin, bindingName) {
    this.#bridgeWranglerOrigin = origin;
    this.#bindingName = bindingName;
  }

  /**
   * @param {string} operation
   * @param {any[]} parameters
   * @param {BodyInit} [body]
   */
  async #dispatch(operation, parameters, body) {
    const res = await fetch(this.#bridgeWranglerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-BINDING-MODULE": "KV",
        "X-BRIDGE-BINDING-NAME": this.#bindingName,
        "X-BRIDGE-R2-Dispatch": JSON.stringify({ operation, parameters }),
      },
      body,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return res;
  }

  /** @param {R2ListOptions} [options] */
  async list(options) {
    const res = await this.#dispatch("list", [options]);
    /** @type {R2ObjectsJSON} */
    const json = await res.json();

    return {
      ...json,
      objects: json.objects.map((o) => new R2Object$(o)),
    };
  }

  /**
   * @param {string} key
   * @param {ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob} value
   * @param {R2PutOptions} [options]
   */
  async put(key, value, options) {
    const res = await this.#dispatch(
      "put",
      [key, null, options],
      // `null` is not a valid type for `BodyInit`.
      // And it seems to have the same effect...
      value ?? undefined
    );
    /** @type {null | R2ObjectJSON} */
    const json = await res.json();

    return json === null ? null : new R2Object$(json);
  }

  /**
   * @param {string} key
   * @param {R2GetOptions} [options]
   */
  async get(key, options) {
    const res = await this.#dispatch("get", [key, options]);

    const headerForR2ObjectBody = res.headers.get("X-BRIDGE-R2-R2ObjectJSON");
    if (headerForR2ObjectBody) {
      const json = JSON.parse(headerForR2ObjectBody);
      return new R2ObjectBody$(json, res);
    }

    /** @type {null | R2ObjectJSON} */
    const json = await res.json();
    return json === null ? null : new R2Object$(json);
  }

  /** @param {string} key */
  async head(key) {
    const res = await this.#dispatch("head", [key]);
    /** @type {null | R2ObjectJSON} */
    const json = await res.json();

    return json === null ? null : new R2Object$(json);
  }

  /** @param {string | string[]} keys */
  async delete(keys) {
    await this.#dispatch("delete", [keys]);
  }
}
