// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2object-definition
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2objectbody-definition
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

    // JSG_LAZY_READONLY_INSTANCE_PROPERTY
    Object.freeze(this);
  }

  toJSON() {
    return this.#checksums;
  }
}

// a.k.a. `HeadResult`
export class R2Object$ {
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
    if (this.httpMetadata?.cacheExpiry)
      this.httpMetadata.cacheExpiry = new Date(this.httpMetadata.cacheExpiry);
    this.customMetadata = metadata.customMetadata;
    this.range = metadata.range;

    // JSG_LAZY_READONLY_INSTANCE_PROPERTY
    Object.freeze(this);
  }

  /** @param {Headers} headers */
  writeHttpMetadata(headers) {
    for (const [key, value] of Object.entries(this.httpMetadata ?? {}))
      headers.set(key, value);
  }
}

// a.k.a. `GetResult`
export class R2ObjectBody$ extends R2Object$ {
  #response;

  /**
   * @param {R2ObjectJSON} metadata
   * @param {Response} response
   */
  constructor(metadata, response) {
    super(metadata);
    this.#response = response;
  }

  // JSG_READONLY_PROTOTYPE_PROPERTY ---
  get body() {
    return this.#response.body ?? new ReadableStream();
  }
  get bodyUsed() {
    return this.#response.bodyUsed;
  }
  // --- JSG_READONLY_PROTOTYPE_PROPERTY

  async arrayBuffer() {
    return this.#response.arrayBuffer();
  }
  async text() {
    return this.#response.text();
  }
  /**
   * @template T
   * @returns {Promise<T>}
   */
  async json() {
    return this.#response.json();
  }
  async blob() {
    return this.#response.blob();
  }
}
