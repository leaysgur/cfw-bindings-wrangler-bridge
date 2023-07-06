// @ts-check

// Refs:
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/kv.c%2B%2B

// KVNamespace
export class KVBridge {
  #wranglerOrigin;
  #bindingName;

  /**
   * @param {string} wranglerOrigin
   * @param {string} bindingName
   */
  constructor(wranglerOrigin, bindingName) {
    this.#wranglerOrigin = wranglerOrigin;
    this.#bindingName = bindingName;
  }

  /** @param {import("@cloudflare/workers-types").KVNamespaceListOptions} [options] */
  async list(options) {
    const res = await fetch(this.#wranglerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-REQUEST": JSON.stringify({
          binding: this.#bindingName,
          operation: "KV.list",
          parameters: [options],
        }),
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const json = await res.json();
    return json;
  }

  /**
   * @param {string} key
   * @param {string | ArrayBuffer | ArrayBufferView | ReadableStream} value
   * @param {import("@cloudflare/workers-types").KVNamespacePutOptions} [options]
   */
  async put(key, value, options) {
    const res = await fetch(this.#wranglerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-REQUEST": JSON.stringify({
          binding: this.#bindingName,
          operation: "KV.put",
          parameters: [key, null, options],
        }),
      },
      body: value,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
  }

  /**
   * @template Type
   * @param {string} key
   * @param {import("@cloudflare/workers-types").KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async get(key, typeOrOptions) {
    const { value } = await this.getWithMetadata(key, typeOrOptions);
    return value;
  }

  /**
   * @template Type
   * @param {string} key
   * @param {import("@cloudflare/workers-types").KVNamespaceGetOptions<Type>} [typeOrOptions]
   */
  async getWithMetadata(key, typeOrOptions) {
    const res = await fetch(this.#wranglerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-REQUEST": JSON.stringify({
          binding: this.#bindingName,
          operation: "KV.getWithMetadata",
          parameters: [key, typeOrOptions],
        }),
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const { metadata } = JSON.parse(
      res.headers.get("X-BRIDGE-RESPONSE") ?? "{}"
    );

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

    return { value, metadata: metadata ?? null };
  }

  /** @param {string} key */
  async delete(key) {
    const res = await fetch(this.#wranglerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-REQUEST": JSON.stringify({
          binding: this.#bindingName,
          operation: "KV.delete",
          parameters: [key],
        }),
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
  }
}
