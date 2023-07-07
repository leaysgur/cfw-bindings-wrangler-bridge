// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-bucket.c%2B%2B
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-rpc.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/bucket.ts
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/r2Object.ts

/**
 * @typedef {(
 *   Omit<R2Object, "checksums" | "writeHttpMetadata">
 *   & { checksums: R2StringChecksums; }
 * )} R2ObjectJSON
 *
 * @typedef {(
 *   Omit<R2Objects, "objects">
 *   & { objects: R2ObjectJSON[]; }
 * )} R2ObjectsJSON
 */

/** @param {string} hex */
const hexToArrayBuffer = (hex) => {
  const view = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2)
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);

  return view.buffer;
};

class R2Checksums$ {
  #checksums;
  md5;
  sha1;
  sha256;
  sha384;
  sha512;

  /** @param {R2StringChecksums} checksums */
  constructor(checksums) {
    this.#checksums = checksums;

    this.md5 = checksums.md5 ? hexToArrayBuffer(checksums.md5) : undefined;
    this.sha1 = checksums.sha1 ? hexToArrayBuffer(checksums.sha1) : undefined;
    this.sha256 = checksums.sha256
      ? hexToArrayBuffer(checksums.sha256)
      : undefined;
    this.sha384 = checksums.sha384
      ? hexToArrayBuffer(checksums.sha384)
      : undefined;
    this.sha512 = checksums.sha512
      ? hexToArrayBuffer(checksums.sha512)
      : undefined;
  }

  toJSON() {
    return this.#checksums;
  }
}

class R2Object$ {
  key;
  version;
  size;
  etag;
  httpEtag;
  checksums;
  uploaded;
  httpMetadata;
  customMetadata;
  range;

  /** @param {R2ObjectJSON} metadata */
  constructor(metadata) {
    this.key = metadata.key;
    this.version = metadata.version;
    this.size = metadata.size;
    this.etag = metadata.etag;
    this.httpEtag = metadata.httpEtag;
    this.checksums = new R2Checksums$(metadata.checksums);
    this.uploaded = new Date(metadata.uploaded);
    this.httpMetadata = metadata.httpMetadata;
    this.customMetadata = metadata.customMetadata;
    this.range = metadata.range;
  }

  /** @param {Headers} headers */
  writeHttpMetadata(headers) {
    for (const [key, value] of Object.entries(this.httpMetadata ?? {}))
      headers.set(key, value);
  }
}

class R2ObjectBody$ extends R2Object$ {
  #response;
  body;
  bodyUsed;

  /**
   * @param {R2ObjectJSON} metadata
   * @param {Response} response
   */
  constructor(metadata, response) {
    super(metadata);
    this.#response = response;

    this.body = response.body ?? new ReadableStream();
    this.bodyUsed = response.bodyUsed;
  }

  async arrayBuffer() {
    return this.#response.arrayBuffer();
  }
  async text() {
    return this.#response.text();
  }
  async json() {
    return this.#response.json();
  }
  async blob() {
    return this.#response.blob();
  }
}

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
        "X-BRIDGE-R2-Dispatch": JSON.stringify({ operation, parameters }),
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

    return json === null ? null : new R2Object$(json);
  }

  /**
   * @param {string} key
   * @param {R2GetOptions} [options]
   */
  async get(key, options) {
    const res = await this.#dispatch("get", [key, options]);

    const headerForR2ObjectBody = res.headers.get("X-BRIDGE-R2-R2ObjectJSON");
    if (headerForR2ObjectBody) {
      const json = JSON.parse(headerForR2ObjectBody);
      return new R2ObjectBody$(json, res);
    }

    /** @type {null | R2ObjectJSON} */
    const json = await res.json();

    return json === null ? null : new R2Object$(json);
  }

  /** @param {string} key */
  async head(key) {
    const res = await this.#dispatch("head", [key]);

    /** @type {null | R2ObjectJSON} */
    const json = await res.json();

    return json === null ? null : new R2Object$(json);
  }

  /** @param {string | string[]} keys */
  async delete(keys) {
    await this.#dispatch("delete", [keys]);
  }
}
