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
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return res;
  }

  /** @param {KVNamespaceListOptions} [options] */
  async list(options) {
    const res = await this.#dispatch("KVNamespace.list", [options]);
    const json = await res.json();

    return json;
  }

  /**
   * @param {string} key
   * @param {string | ArrayBuffer | ArrayBufferView | ReadableStream} value
   * @param {KVNamespacePutOptions} [options]
   */
  async put(key, value, options) {
    await this.#dispatch("KVNamespace.put", [encodeKey(key), options], value);
  }

  /**
   * @template Type
   * @param {string} key
   * @param {KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async get(key, typeOrOptions) {
    const { value } = await this.getWithMetadata(key, typeOrOptions);
    return value;
  }

  /**
   * @template Type
   * @param {string} key
   * @param {KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async getWithMetadata(key, typeOrOptions) {
    const res = await this.#dispatch("KVNamespace.getWithMetadata", [
      encodeKey(key),
      typeOrOptions,
    ]);

    if (res.headers.get("X-BRIDGE-KV-ValueIsNull") === "true")
      return { value: null, metadata: null };

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

    const metadata = parse(res.headers.get("X-BRIDGE-KV-Metadata") ?? "null");

    return { value, metadata };
  }

  /** @param {string} key */
  async delete(key) {
    await this.#dispatch("KVNamespace.delete", [encodeKey(key)]);
  }
}
