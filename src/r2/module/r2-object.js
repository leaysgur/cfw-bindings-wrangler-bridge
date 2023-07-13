// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2object-definition
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2objectbody-definition
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/r2Object.ts

import { hexStringToArrayBuffer } from "../shared.js";
/**
 * @typedef {import("./types.d.ts").R2ObjectJSON} R2ObjectJSON
 * @typedef {import("./types.d.ts").R2ObjectsJSON} R2ObjectsJSON
 */

// implements R2Checksums
class Checksums$ {
  #checksums;
  md5;
  sha1;
  sha256;
  sha384;
  sha512;

  /** @param {R2StringChecksums} checksums */
  constructor(checksums) {
    this.#checksums = checksums;

    this.md5 = checksums.md5
      ? hexStringToArrayBuffer(checksums.md5)
      : undefined;
    this.sha1 = checksums.sha1
      ? hexStringToArrayBuffer(checksums.sha1)
      : undefined;
    this.sha256 = checksums.sha256
      ? hexStringToArrayBuffer(checksums.sha256)
      : undefined;
    this.sha384 = checksums.sha384
      ? hexStringToArrayBuffer(checksums.sha384)
      : undefined;
    this.sha512 = checksums.sha512
      ? hexStringToArrayBuffer(checksums.sha512)
      : undefined;

    // JSG_LAZY_READONLY_INSTANCE_PROPERTY
    Object.freeze(this);
  }

  toJSON() {
    return this.#checksums;
  }
}

// implements `R2Object`
export class HeadResult$ {
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
    this.checksums = new Checksums$(metadata.checksums);
    this.uploaded = new Date(metadata.uploaded);
    this.httpMetadata = {
      ...metadata.httpMetadata,
      cacheExpiry: metadata.httpMetadata.cacheExpiry
        ? new Date(metadata.httpMetadata.cacheExpiry)
        : undefined,
    };
    // If value was `undefined`, should drop key
    if (!metadata.httpMetadata.cacheExpiry)
      delete this.httpMetadata.cacheExpiry;
    this.customMetadata = metadata.customMetadata;
    this.range = metadata.range;

    // JSG_LAZY_READONLY_INSTANCE_PROPERTY
    Object.freeze(this);
  }

  /** @param {Headers} headers */
  writeHttpMetadata(headers) {
    if (this.httpMetadata?.contentType)
      headers.set("content-type", this.httpMetadata.contentType);
    if (this.httpMetadata?.contentLanguage)
      headers.set("content-language", this.httpMetadata.contentLanguage);
    if (this.httpMetadata?.contentDisposition)
      headers.set("content-disposition", this.httpMetadata.contentDisposition);
    if (this.httpMetadata?.contentEncoding)
      headers.set("content-encoding", this.httpMetadata.contentEncoding);
    if (this.httpMetadata?.cacheControl)
      headers.set("cache-control", this.httpMetadata.cacheControl);
    if (this.httpMetadata?.cacheExpiry)
      headers.set("expires", this.httpMetadata.cacheExpiry.toUTCString());
  }
}

// implements `R2ObjectBody`
export class GetResult$ extends HeadResult$ {
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

// `R2Objects` is not implemented as class, just an `Object`
