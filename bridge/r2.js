// @ts-check

// Refs:
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-bucket.c%2B%2B
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-rpc.c%2B%2B

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
   * @param {R2Checksums?} checksums
   * @param {Date?} uploaded
   * @param {R2HTTPMetadata?} httpMetadata
   * @param {Record<string, string>?} customMetadata
   * @param {R2Range?} range
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
  async #fetch(operation, parameters, body) {
    const res = await fetch(this.#bridgeWranglerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-BINDING-MODULE": "KV",
        "X-BRIDGE-BINDING-NAME": this.#bindingName,
        "X-BRIDGE-R2-REQUEST": JSON.stringify({ operation, parameters }),
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
    const res = await this.#fetch("list", [options]);

    // TODO: return R2Object or null
    const json = await res.json();
    return json;
  }

  /**
   * @param {string} key
   * @param {ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob} value
   * @param {R2PutOptions} [options]
   */
  async put(key, value, options) {
    const res = await this.#fetch(
      "put",
      [key, null, options],
      // `null` is not a valid type for `BodyInit`.
      // What actually happens when `null` is passed...?
      value ?? undefined
    );

    // TODO: return R2Object or null
    const json = await res.json();
    return json;
  }

  /**
   * @param {string} key
   * @param {R2GetOptions} [options]
   */
  async get(key, options) {
    const res = await this.#fetch("get", [key, options]);

    // HeadResult ...?
    class R2Object {
      // readonly key: string;
      // readonly version: string;
      // readonly size: number;
      // readonly etag: string;
      // readonly httpEtag: string;
      // readonly checksums: R2Checksums;
      // readonly uploaded: Date;
      // readonly httpMetadata?: R2HTTPMetadata;
      // readonly customMetadata?: Record<string, string>;
      // readonly range?: R2Range;
      constructor() {}
      writeHttpMetadata() {}
    }
    class R2ObjectBody extends R2Object {
      // get body(): ReadableStream;
      // get bodyUsed(): boolean;
      constructor() {}
      async arrayBuffer() {}
      async text() {}
      async json() {}
      async blob() {}
    }

    // TODO: return
    // null
    // R2Object: JSON
    // R2ObjectBody: body: ReadableStream
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

  /** @param {string} key */
  async head(key) {
    const res = await this.#fetch("head", [key]);

    // TODO: return R2Object or null
    const json = await res.json();
    return json;
  }

  /** @param {string} key */
  async delete(key) {
    await this.#fetch("delete", [key]);
  }
}
