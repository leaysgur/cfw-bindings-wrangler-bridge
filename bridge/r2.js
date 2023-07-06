// @ts-check

class R2ObjectBody extends Response {
  /** @type {string?} */
  key;

  /** @type {string?} */
  version;

  /** @type {number?} */
  size;

  /** @type {string?} */
  etag;

  /** @type {string?} */
  httpEtag;

  /** @type {import("@cloudflare/workers-types").R2Checksums?}*/
  checksums;

  /** @type {Date?} */
  uploaded;

  /** @type {import("@cloudflare/workers-types").R2HTTPMetadata?}*/
  httpMetadata;

  /** @type {Record<string, string>?} */
  customMetadata;

  /** @type {import("@cloudflare/workers-types").R2Range?}*/
  range;

  /**
   * @param {BodyInit | null} body
   * @param {ResponseInit?} init
   * @param {string?} key
   * @param {string?} version
   * @param {number?} size
   * @param {string?} etag
   * @param {string?} httpEtag
   * @param {import("@cloudflare/workers-types").R2Checksums?} checksums
   * @param {Date?} uploaded
   * @param {import("@cloudflare/workers-types").R2HTTPMetadata?} httpMetadata
   * @param {Record<string, string>?} customMetadata
   * @param {import("@cloudflare/workers-types").R2Range?} range
   */
  constructor(
    body,
    init,
    key,
    version,
    size,
    etag,
    httpEtag,
    checksums,
    uploaded,
    httpMetadata,
    customMetadata,
    range
  ) {
    super(body, init ?? undefined);

    this.key = key;
    this.version = version;
    this.size = size;
    this.etag = etag;
    this.httpEtag = httpEtag;
    this.checksums = checksums;
    this.uploaded = uploaded;
    this.httpMetadata = httpMetadata;
    this.customMetadata = customMetadata;
    this.range = range;
  }
}

// R2Bucket
export class R2Bridge {
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

  /** @param {import("@cloudflare/workers-types").R2ListOptions} [options] */
  async list(options) {
    const url = new URL(this.#wranglerOrigin);
    url.pathname = `/r2_list/${this.#bindingName}`;

    const req = new Request(url, { method: "GET" });
    if (options) req.headers.set("CF-R2-OPTIONS", JSON.stringify(options));

    const res = await fetch(req);
    const json = await res.json();
    return json;
  }

  /**
   * @param {string} key
   * @param {ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob} value
   * @param {import("@cloudflare/workers-types").R2PutOptions} [options]
   */
  async put(key, value, options) {
    const url = new URL(this.#wranglerOrigin);
    // pathname is like `/r2_get/BINDING/encodeURIComponent(key)`
    url.pathname = `/r2_put/${this.#bindingName}/${encodeURIComponent(key)}`;

    const req = new Request(url, { method: "PUT", body: value });
    if (options) req.headers.set("CF-R2-OPTIONS", JSON.stringify(options));

    await fetch(req);
  }

  /**
   * @param {string} key
   * @param {import("@cloudflare/workers-types").R2GetOptions} options
   */
  async get(key, options) {
    const url = new URL(this.#wranglerOrigin);
    url.pathname = `/r2_get/${this.#bindingName}/${encodeURIComponent(key)}`;

    const req = new Request(url, { method: "GET" });
    if (options) req.headers.set("CF-R2-OPTIONS", JSON.stringify(options));

    const res = await fetch(req);

    if (!res.ok && res.status === 404) return null;

    const r2ObjectInHeader = JSON.parse(
      res.headers.get("CF-R2-Object") ?? "null"
    );

    return new R2ObjectBody(
      res.body,
      null,
      r2ObjectInHeader?.key,
      r2ObjectInHeader?.version,
      r2ObjectInHeader?.size,
      r2ObjectInHeader?.etag,
      r2ObjectInHeader?.httpEtag,
      r2ObjectInHeader?.checksums,
      r2ObjectInHeader?.uploaded,
      r2ObjectInHeader?.httpMetadata,
      r2ObjectInHeader?.customMetadata,
      r2ObjectInHeader?.range
    );
  }

  /**
   * @param {string} key
   */
  async head(key) {
    const url = new URL(this.#wranglerOrigin);
    url.pathname = `/r2_head/${this.#bindingName}/${encodeURIComponent(key)}`;

    return await fetch(url);
  }

  /** @param {string} key */
  async delete(key) {
    const url = new URL(this.#wranglerOrigin);
    url.pathname = `/r2_delete/${this.#bindingName}/${encodeURIComponent(key)}`;

    await fetch(url, { method: "DELETE" });
  }
}
