// @ts-check

// Refs:
// https://developers.cloudflare.com/workers/runtime-apis/kv/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/kv.c%2B%2B#L230
// https://github.com/cloudflare/miniflare/blob/master/packages/kv/src/namespace.ts#L384

// implements KVNamespace
export class KVBridgeModule {
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
        "X-BRIDGE-KV-REQUEST": JSON.stringify({ operation, parameters }),
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
    const res = await this.#dispatch("list", [options]);

    const json = await res.json();
    return json;
  }

  /**
   * @param {string} key
   * @param {string | ArrayBuffer | ArrayBufferView | ReadableStream} value
   * @param {KVNamespacePutOptions} [options]
   */
  async put(key, value, options) {
    await this.#dispatch("put", [key, null, options], value);
  }

  /**
   * @template Type
   * @param {string} key
   * @param {KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async get(key, typeOrOptions) {
    const res = await this.#dispatch("get", [key, typeOrOptions]);

    let type;
    if (!typeOrOptions) {
      type = "text";
    } else if (typeof typeOrOptions === "string") {
      type = typeOrOptions;
    } else {
      type = typeOrOptions.type;
    }

    let value;
    if (type === "json") value = await res.json();
    if (type === "text") value = await res.text();
    if (type === "arrayBuffer") value = await res.arrayBuffer();
    if (type === "stream") value = res.body;

    return value;
  }

  /**
   * @template Type
   * @param {string} key
   * @param {KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async getWithMetadata(key, typeOrOptions) {
    const res = await this.#dispatch("getWithMetadata", [key, typeOrOptions]);

    let type;
    if (!typeOrOptions) {
      type = "text";
    } else if (typeof typeOrOptions === "string") {
      type = typeOrOptions;
    } else {
      type = typeOrOptions.type;
    }

    let value;
    if (type === "json") value = await res.json();
    if (type === "text") value = await res.text();
    if (type === "arrayBuffer") value = await res.arrayBuffer();
    if (type === "stream") value = res.body;

    const { metadata } = JSON.parse(
      res.headers.get("X-BRIDGE-KV-RESPONSE") ?? "{}"
    );

    return { value, metadata: metadata ?? null };
  }

  /** @param {string} key */
  async delete(key) {
    await this.#dispatch("delete", [key]);
  }
}
