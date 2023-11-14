// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-bucket.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/tre/packages/miniflare/src/plugins/r2/gateway.ts#L521

// Notes:
// `devalue` is only used for `dispatch()` payload.
// Use it for all I/Os may be ideal but it's not easy.
// `R2Object` and `R2ObjectBody` hold too many non-POJO values...
// But `R2Object(Body)` can be `JSON.stringify()` at no cost.
// See `R2ObjectJSON` type for that conversion.

import { stringify } from "devalue";
import { HeadResult$, GetResult$ } from "./r2-object.js";
import { R2MultipartUpload$ } from "./multipart.js";
import { arrayBufferToHexString, encodeKey } from "./shared.js";
import { resolveModuleOptions } from "../utils.js";
/**
 * @typedef {import("./types.ts").Dispatch} Dispatch
 * @typedef {import("./types.ts").R2ObjectJSON} R2ObjectJSON
 * @typedef {import("./types.ts").R2ObjectsJSON} R2ObjectsJSON
 * @typedef {import("./types.ts").R2MultipartUploadJSON} R2MultipartUploadJSON
 * @typedef {import("../index.d.ts").BridgeModuleOptions} BridgeModuleOptions
 */

export class R2Bucket$ {
  #bindingName;
  #fetchImpl;
  #bridgeWorkerOrigin;

  /**
   * @param {string} bindingName
   * @param {BridgeModuleOptions} [options]
   */
  constructor(bindingName, options) {
    this.#bindingName = bindingName;

    const { fetchImpl, bridgeWorkerOrigin } = resolveModuleOptions(options);
    this.#fetchImpl = fetchImpl;
    this.#bridgeWorkerOrigin = bridgeWorkerOrigin;
  }

  /** @type {Dispatch} */
  async #dispatch(operation, parameters, body) {
    const res = await this.#fetchImpl(this.#bridgeWorkerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-BINDING-MODULE": "R2",
        "X-BRIDGE-BINDING-NAME": this.#bindingName,
        "X-BRIDGE-R2-Dispatch": stringify(
          { operation, parameters },
          {
            // Date: Handled by default
            Headers: (v) => v instanceof Headers && Array.from(v),
            ArrayBuffer: (v) =>
              v instanceof ArrayBuffer && arrayBufferToHexString(v),
          },
        ),
      },
      body,
      // @ts-expect-error: https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1483
      duplex: "half",
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return res;
  }

  /** @param {import("@cloudflare/workers-types/experimental").R2ListOptions} [options] */
  async list(options) {
    const res = await this.#dispatch("R2Bucket.list", [options]);
    const json = /** @type {R2ObjectsJSON} */ (await res.json());

    return {
      ...json,
      objects: json.objects.map((o) => new HeadResult$(o)),
    };
  }

  /**
   * @param {string} key
   * @param {ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob} value
   * @param {import("@cloudflare/workers-types/experimental").R2PutOptions} [options]
   */
  async put(key, value, options) {
    const res = await this.#dispatch(
      "R2Bucket.put",
      [encodeKey(key), null, options],
      // `null` is not a valid type for `BodyInit`.
      // And it seems to have the same effect...
      value ?? undefined,
    );
    const json = /** @type {null | R2ObjectJSON} */ (await res.json());

    return json === null ? null : new HeadResult$(json);
  }

  /**
   * @param {string} key
   * @param {import("@cloudflare/workers-types/experimental").R2GetOptions} [options]
   */
  async get(key, options) {
    const res = await this.#dispatch("R2Bucket.get", [encodeKey(key), options]);

    const headerForR2ObjectBody = res.headers.get("X-BRIDGE-R2-R2ObjectJSON");
    if (headerForR2ObjectBody) {
      const json = JSON.parse(headerForR2ObjectBody);
      return new GetResult$(json, res);
    }

    const json = /** @type {null | R2ObjectJSON} */ (await res.json());
    return json === null ? null : new HeadResult$(json);
  }

  /** @param {string} key */
  async head(key) {
    const res = await this.#dispatch("R2Bucket.head", [encodeKey(key)]);
    const json = /** @type {null | R2ObjectJSON} */ (await res.json());

    return json === null ? null : new HeadResult$(json);
  }

  /** @param {string | string[]} keys */
  async delete(keys) {
    keys =
      typeof keys === "string"
        ? encodeKey(keys)
        : keys.map((key) => encodeKey(key));
    await this.#dispatch("R2Bucket.delete", [keys]);
  }

  /**
   * @param {string} key
   * @param {import("@cloudflare/workers-types/experimental").R2MultipartOptions} [options]
   */
  async createMultipartUpload(key, options) {
    const res = await this.#dispatch("R2Bucket.createMultipartUpload", [
      encodeKey(key),
      options,
    ]);
    const json = /** @type {R2MultipartUploadJSON} */ (await res.json());

    return new R2MultipartUpload$(json, this.#dispatch.bind(this));
  }

  /**
   * @param {string} key
   * @param {string} uploadId
   */
  resumeMultipartUpload(key, uploadId) {
    return new R2MultipartUpload$({ key, uploadId }, this.#dispatch.bind(this));
  }
}
