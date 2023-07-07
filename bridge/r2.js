// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-bucket.c%2B%2B
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-rpc.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/bucket.ts
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/r2Object.ts

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

    if (json === null) return null;
    return new R2Object$(json);
  }

  /**
   * @param {string} key
   * @param {R2GetOptions} [options]
   */
  async get(key, options) {
    const res = await this.#dispatch("get", [key, options]);

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
  }

  /** @param {string} key */
  async head(key) {
    const res = await this.#dispatch("head", [key]);

    /** @type {null | R2ObjectJSON} */
    const json = await res.json();

    if (json === null) return null;
    return new R2Object$(json);
  }

  /** @param {string | string[]} keys */
  async delete(keys) {
    await this.#dispatch("delete", [keys]);
  }
}

/** @param {string} hex */
const hexToArrayBuffer = (hex) => {
  const view = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2)
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);

  return view.buffer;
};

/**
 * @typedef {(
 *   Omit<R2Object, "checksums" | "writeHttpMetadata">
 *   & { checksums: R2StringChecksums; }
 * )} R2ObjectJSON
 */

class R2Checksums$ {
  /** @type {R2StringChecksums} */
  #checksums;

  /** @param {R2StringChecksums} checksums */
  constructor(checksums) {
    this.#checksums = checksums;
  }

  get md5() {
    if (this.#checksums.md5) return hexToArrayBuffer(this.#checksums.md5);
    return undefined;
  }
  get sha1() {
    if (this.#checksums.sha1) return hexToArrayBuffer(this.#checksums.sha1);
    return undefined;
  }
  get sha256() {
    if (this.#checksums.sha256) return hexToArrayBuffer(this.#checksums.sha256);
    return undefined;
  }
  get sha384() {
    if (this.#checksums.sha384) return hexToArrayBuffer(this.#checksums.sha384);
    return undefined;
  }
  get sha512() {
    if (this.#checksums.sha512) return hexToArrayBuffer(this.#checksums.sha512);
    return undefined;
  }

  toJSON() {
    return this.#checksums;
  }
}

class R2Object$ {
  /** @type {R2ObjectJSON} */
  #metadata;

  /** @param {R2ObjectJSON} metadata */
  constructor(metadata) {
    this.#metadata = metadata;
  }

  get key() {
    return this.#metadata.key;
  }
  get version() {
    return this.#metadata.version;
  }
  get size() {
    return this.#metadata.size;
  }
  get etag() {
    return this.#metadata.etag;
  }
  get httpEtag() {
    return this.#metadata.httpEtag;
  }
  get checksums() {
    return new R2Checksums$(this.#metadata.checksums);
  }
  get uploaded() {
    return new Date(this.#metadata.uploaded);
  }
  get httpMetadata() {
    return this.#metadata.httpMetadata;
  }
  get customMetadata() {
    return this.#metadata.customMetadata;
  }
  get range() {
    return this.#metadata.range;
  }

  /** @param {Headers} headers */
  writeHttpMetadata(headers) {
    for (const [key, value] of Object.entries(
      this.#metadata.httpMetadata ?? {}
    ))
      headers.set(key, value);
  }
}

/**
 * @typedef {(
 *   Omit<R2Objects, "objects">
 *   & { objects: R2ObjectJSON[]; }
 * )} R2ObjectsJSON
 */
