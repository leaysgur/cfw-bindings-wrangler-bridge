// @ts-check

// Refs: 
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/kv.c%2B%2B
// https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/kv/index.ts
export class KVBridge {
  #wranglerUrl;
  #namespaceId;

  /** 
   * @param {string} wranglerUrl
   * @param {string} namespaceId
   */
  constructor(wranglerUrl, namespaceId) {
    this.#wranglerUrl = wranglerUrl;
    this.#namespaceId = namespaceId;
  }

  /** @param {import("@cloudflare/workers-types").KVNamespaceListOptions} [options] */
  async list(options) {
    const url = new URL(this.#wranglerUrl);
    url.pathname = `/kv_list/${this.#namespaceId}`;

    if (typeof options?.prefix === "string")
      url.searchParams.set("prefix", options.prefix);
    if (typeof options?.limit === "number")
      url.searchParams.set("limit", String(options.limit));
    if (typeof options?.cursor === "string")
      url.searchParams.set("cursor", options.cursor);

    const res = await fetch(url);
    const json = await res.json();

    return json;
  }

  /** 
   * @param {string} key
   * @param {string | ArrayBuffer | ArrayBufferView | ReadableStream} value
   * @param {import("@cloudflare/workers-types").KVNamespacePutOptions} [options]
   */
  async put(key, value, options) {
    const url = new URL(this.#wranglerUrl);
    url.pathname = `/kv_put/${this.#namespaceId}/${encodeURIComponent(key)}`;

    if (typeof options?.expirationTtl === "number")
      url.searchParams.set("expirationTtl", String(options.expirationTtl));
    if (typeof options?.expiration === "number")
      url.searchParams.set("expiration", String(options.expiration));

    const req = new Request(url, { method: "PUT", body: value });
    if (options?.metadata)
      req.headers.set("CF-KV-Metadata", JSON.stringify(options.metadata));

    await fetch(req);
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
    const url = new URL(this.#wranglerUrl);
    url.pathname = `/kv_get/${this.#namespaceId}/${encodeURIComponent(key)}`;

    let type;
    let cacheTtl;
    if (!typeOrOptions) {
      type = "text";
    }  else if (typeof typeOrOptions === "string") {
      type = typeOrOptions;
    } else {
      type = typeOrOptions.type;
      cacheTtl = typeOrOptions.cacheTtl;
    }

    if (typeof cacheTtl === "number") 
      url.searchParams.set("cacheTtl", String(cacheTtl));

    const res = await fetch(url);
    const metadata = JSON.parse(res.headers.get("CF-KV-Metadata") ?? "null");

    let value;
    if (type === "json") value = await res.json();
    if (type === "text") value = await res.text();
    if (type === "arrayBuffer") value = await res.arrayBuffer();
    if (type === "stream") value = res.body;

    return { value, metadata };
  }

  /** @param {string} key */
  async delete(key) {
    const url = new URL(this.#wranglerUrl);
    url.pathname = `/kv_delete/${this.#namespaceId}/${encodeURIComponent(key)}`;

    await fetch(url, { method: "DELETE" });
  }
}
