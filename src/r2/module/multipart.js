// @ts-check

// Refs:
// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2multipartupload-definition
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/r2-multipart.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/master/packages/r2/src/multipart.ts

import { encodeKey } from "../shared.js";
import { HeadResult$ } from "./r2-object.js";
/**
 * @typedef {import("./types.d.ts").Dispatch} Dispatch
 * @typedef {import("./types.d.ts").R2MultipartUploadJSON} R2MultipartUploadJSON
 * @typedef {import("./types.d.ts").R2ObjectJSON} R2ObjectJSON
 */

// implements R2MultipartUpload
export class R2MultipartUpload$ {
  #dispatch;
  key;
  uploadId;

  /**
   * @param {R2MultipartUploadJSON} json
   * @param {Dispatch} dispatch
   */
  constructor({ key, uploadId }, dispatch) {
    this.#dispatch = dispatch;

    this.key = key;
    this.uploadId = uploadId;

    // JSG_LAZY_READONLY_INSTANCE_PROPERTY
    Object.freeze(this);
  }

  /**
   * @param {number} partNumber
   * @param {ReadableStream | (ArrayBuffer | ArrayBufferView) | string | Blob} value
   */
  async uploadPart(partNumber, value) {
    const res = await this.#dispatch(
      "R2MultipartUpload.uploadPart",
      [encodeKey(this.key), this.uploadId, partNumber],
      value,
    );
    /** @type {R2UploadedPart} */
    const json = await res.json();

    return json;
  }

  async abort() {
    await this.#dispatch("R2MultipartUpload.abort", [
      encodeKey(this.key),
      this.uploadId,
    ]);
  }

  /** @param {R2UploadedPart[]} uploadedParts */
  async complete(uploadedParts) {
    const res = await this.#dispatch("R2MultipartUpload.complete", [
      encodeKey(this.key),
      this.uploadId,
      uploadedParts,
    ]);
    /** @type {R2ObjectJSON} */
    const json = await res.json();

    return new HeadResult$(json);
  }
}
