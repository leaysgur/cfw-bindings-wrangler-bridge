// @ts-check

// Refs:
// https://developers.cloudflare.com/workers/runtime-apis/kv/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/kv.c%2B%2B#L230
// https://github.com/cloudflare/miniflare/blob/tre/packages/miniflare/src/plugins/kv/gateway.ts#L155

import { stringify, parse } from "devalue";

/** @param {string} key */
const encodeKey = (key) => encodeURIComponent(key);

export class KVNamespace$ {
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
        "X-BRIDGE-BINDING-MODULE": "KV",
        "X-BRIDGE-BINDING-NAME": this.#bindingName,
        "X-BRIDGE-KV-Dispatch": stringify({ operation, parameters }),
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

  /** @param {import("@cloudflare/workers-types/experimental").KVNamespaceListOptions} [options] */
  async list(options) {
    const res = await this.#dispatch("KVNamespace.list", [options]);
    const json = await res.json();

    return json;
  }

  /**
   * @param {string} key
   * @param {ReadableStream | ArrayBuffer | ArrayBufferView | string} value
   * @param {import("@cloudflare/workers-types/experimental").KVNamespacePutOptions} [options]
   */
  async put(key, value, options) {
    await this.#dispatch("KVNamespace.put", [encodeKey(key), options], value);
  }

  /**
   * @template Type
   * @param {string} key
   * @param {import("@cloudflare/workers-types/experimental").KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async get(key, typeOrOptions) {
    const { value } = await this.getWithMetadata(key, typeOrOptions);
    return value;
  }

  /**
   * @template Type
   * @param {string} key
   * @param {import("@cloudflare/workers-types/experimental").KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async getWithMetadata(key, typeOrOptions) {
    const res = await this.#dispatch("KVNamespace.getWithMetadata", [
      encodeKey(key),
      typeOrOptions,
    ]);

    if (res.headers.get("X-BRIDGE-KV-ValueIsNull") === "true")
      return { value: null, metadata: null, cacheStatus: null };

    let type;
    if (typeof typeOrOptions?.type === "string") {
      type = typeOrOptions.type;
    } else if (typeof typeOrOptions === "string") {
      type = typeOrOptions;
    } else {
      type = "text";
    }

    let value;
    if (type === "json") value = await res.json();
    if (type === "text") value = await res.text();
    if (type === "arrayBuffer") value = await res.arrayBuffer();
    if (type === "stream") value = res.body;

    // `null` is `[null]` in `devalue`
    const metadata = parse(res.headers.get("X-BRIDGE-KV-Metadata") ?? "[null]");
    const cacheStatus = parse(
      res.headers.get("X-BRIDGE-KV-CacheStatus") ?? "[null]",
    );

    return { value, metadata, cacheStatus };
  }

  /** @param {string} key */
  async delete(key) {
    await this.#dispatch("KVNamespace.delete", [encodeKey(key)]);
  }
}
