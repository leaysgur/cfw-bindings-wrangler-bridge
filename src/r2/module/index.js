// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-bucket.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/bucket.ts

import { stringify } from "devalue";
import { HeadResult$, GetResult$ } from "./r2-object.js";
import { arrayBufferToHexString } from "../utils.js";
/**
 * @typedef {import("./r2-object.js").R2ObjectJSON} R2ObjectJSON
 * @typedef {import("./r2-object.js").R2ObjectsJSON} R2ObjectsJSON
 */

/** @param {unknown} t */
const stringifyDispatchHeader = (t) =>
  stringify(t, {
    Headers: (v) => v instanceof Headers && Array.from(v),
    ArrayBuffer: (v) => v instanceof ArrayBuffer && arrayBufferToHexString(v),
  });

/**
 * @param {string} t
 * @returns {R2ObjectsJSON}
 */
const parseR2ObjectsJSON = (t) => JSON.parse(t);
/**
 * @param {string} t
 * @returns {R2ObjectJSON | null}
 */
const parseR2ObjectJSON = (t) => JSON.parse(t);

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
   * @param {unknown[]} parameters
   * @param {BodyInit} [body]
   */
  async #dispatch(operation, parameters, body) {
    const res = await fetch(this.#bridgeWranglerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-BINDING-MODULE": "R2",
        "X-BRIDGE-BINDING-NAME": this.#bindingName,
        "X-BRIDGE-R2-Dispatch": stringifyDispatchHeader({
          operation,
          parameters,
        }),
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
    const json = await res.text().then((t) => parseR2ObjectsJSON(t));

    return {
      ...json,
      objects: json.objects.map((o) => new HeadResult$(o)),
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
      value ?? undefined,
    );
    const json = await res.text().then((t) => parseR2ObjectJSON(t));

    return json === null ? null : new HeadResult$(json);
  }

  /**
   * @param {string} key
   * @param {R2GetOptions} [options]
   */
  async get(key, options) {
    const res = await this.#dispatch("get", [key, options]);

    const headerForR2ObjectBody = res.headers.get("X-BRIDGE-R2-R2ObjectJSON");
    if (headerForR2ObjectBody) {
      const json = parseR2ObjectJSON(headerForR2ObjectBody);
      // @ts-ignore: `json` is not `null` here
      return new GetResult$(json, res);
    }

    const json = await res.text().then((t) => parseR2ObjectJSON(t));
    return json === null ? null : new HeadResult$(json);
  }

  /** @param {string} key */
  async head(key) {
    const res = await this.#dispatch("head", [key]);
    const json = await res.text().then((t) => parseR2ObjectJSON(t));

    return json === null ? null : new HeadResult$(json);
  }

  /** @param {string | string[]} keys */
  async delete(keys) {
    await this.#dispatch("delete", [keys]);
  }
}
