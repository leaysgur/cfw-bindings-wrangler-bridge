// @ts-check
import { deepStrictEqual } from "node:assert";
import {
  createRunner,
  equalRejectedResult,
  sleepAfterRejectedResult,
} from "../test-utils.js";

/**
 * @param {R2MultipartUpload} actual
 * @param {R2MultipartUpload} expect
 */
const _equalR2MultipartUpload = (actual, expect) => {
  deepStrictEqual(actual.key, expect.key);
  deepStrictEqual(typeof actual.uploadId, typeof expect.uploadId);

  deepStrictEqual(typeof actual.uploadPart, typeof expect.uploadPart);
  deepStrictEqual(typeof actual.abort, typeof expect.abort);
  deepStrictEqual(typeof actual.complete, typeof expect.complete);
};

/**
 * @param {R2UploadedPart} actual
 * @param {R2UploadedPart} expect
 */
const _equalR2UploadedPart = (actual, expect) => {
  deepStrictEqual(actual.partNumber, expect.partNumber);
  // `etag` is different even if contents is the same
  deepStrictEqual(typeof actual.etag, typeof expect.etag);
};

/**
 * @param {R2Checksums} actual
 * @param {R2Checksums} expect
 */
const __equalR2Checksums = (actual, expect) => {
  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  deepStrictEqual(actual.md5, expect.md5);
  deepStrictEqual(actual.toJSON(), expect.toJSON());
};

/**
 * @param {R2HTTPMetadata | undefined} actual
 * @param {R2HTTPMetadata | undefined} expect
 */
const __equalR2HttpMetadata = (actual, expect) => {
  if (actual !== undefined && expect !== undefined) {
    const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
    deepStrictEqual(aKeys.sort(), eKeys.sort());
    deepStrictEqual(typeof actual.cacheExpiry, typeof expect.cacheExpiry);
    return;
  }

  deepStrictEqual(actual, expect);
};

/**
 * @param {R2Object} actual
 * @param {R2Object} expect
 */
const _equalR2Object = (actual, expect) => {
  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  deepStrictEqual(actual.key, expect.key);
  deepStrictEqual(typeof actual.version, typeof expect.version);
  deepStrictEqual(actual.size, expect.size);
  deepStrictEqual(actual.etag, expect.etag);
  deepStrictEqual(actual.httpEtag, expect.httpEtag);
  __equalR2Checksums(actual.checksums, expect.checksums);
  deepStrictEqual(typeof actual.uploaded, typeof expect.uploaded);
  __equalR2HttpMetadata(actual.httpMetadata, expect.httpMetadata);
  deepStrictEqual(actual.customMetadata, expect.customMetadata);

  deepStrictEqual(
    typeof actual.writeHttpMetadata,
    typeof expect.writeHttpMetadata,
  );
};

/**
 * @param {R2ObjectBody} actual
 * @param {R2ObjectBody} expect
 */
const _equalR2ObjectBody = (actual, expect) => {
  _equalR2Object(actual, expect);

  deepStrictEqual(actual.bodyUsed, expect.bodyUsed);
  deepStrictEqual(typeof actual.body, typeof expect.body);

  deepStrictEqual(typeof actual.arrayBuffer, typeof expect.arrayBuffer);
  deepStrictEqual(typeof actual.text, typeof expect.text);
  deepStrictEqual(typeof actual.json, typeof expect.json);
  deepStrictEqual(typeof actual.blob, typeof expect.blob);
};

/**
 * @param {R2Objects} actual
 * @param {R2Objects} expect
 */
const _equalR2Objects = (actual, expect) => {
  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  deepStrictEqual(actual.truncated, expect.truncated);
  deepStrictEqual(actual.delimitedPrefixes, expect.delimitedPrefixes);
  deepStrictEqual(actual.objects.length, expect.objects.length);
  for (const idx of expect.objects.keys()) {
    _equalR2Object(actual.objects[idx], expect.objects[idx]);
  }
};

/**
 * @param {PromiseSettledResult<unknown>} aRes
 * @param {PromiseSettledResult<unknown>} eRes
 */
const equalR2ObjectResult = (aRes, eRes) => {
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled") {
    // @ts-expect-error: `aRes|eRes` is type `unknown`
    // This extra check is needed since `R2ObjectBody` inherits `R2Object`
    if ("body" in aRes.value === false && "body" in eRes.value === false)
      return _equalR2Object(
        /** @type {R2Object} */ (aRes.value),
        /** @type {R2Object} */ (eRes.value),
      );
  }

  deepStrictEqual(aRes, eRes);
};

/**
 * @param {PromiseSettledResult<unknown>} aRes
 * @param {PromiseSettledResult<unknown>} eRes
 */
const equalR2ObjectBodyResult = (aRes, eRes) => {
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled")
    return _equalR2ObjectBody(
      /** @type {R2ObjectBody} */ (aRes.value),
      /** @type {R2ObjectBody} */ (eRes.value),
    );

  deepStrictEqual(aRes, eRes);
};

/**
 * @param {PromiseSettledResult<unknown>} aRes
 * @param {PromiseSettledResult<unknown>} eRes
 */
const equalR2ObjectsResult = (aRes, eRes) => {
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled")
    return _equalR2Objects(
      /** @type {R2Objects} */ (aRes.value),
      /** @type {R2Objects} */ (eRes.value),
    );

  deepStrictEqual(aRes, eRes);
};

/**
 * @param {PromiseSettledResult<unknown>} aRes
 * @param {PromiseSettledResult<unknown>} eRes
 */
const equalR2MultipartUploadResult = (aRes, eRes) => {
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled")
    return _equalR2MultipartUpload(
      /** @type {R2MultipartUpload} */ (aRes.value),
      /** @type {R2MultipartUpload} */ (eRes.value),
    );

  deepStrictEqual(aRes, eRes);
};

/**
 * @param {PromiseSettledResult<unknown>} aRes
 * @param {PromiseSettledResult<unknown>} eRes
 */
const equalR2UploadedPart = (aRes, eRes) => {
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled")
    return _equalR2UploadedPart(
      /** @type {R2UploadedPart} */ (aRes.value),
      /** @type {R2UploadedPart} */ (eRes.value),
    );

  deepStrictEqual(aRes, eRes);
};

/** @param {[R2Bucket, R2Bucket]} bindings */
export const createSpecs = ([ACTUAL, EXPECT]) => {
  const beforeEach = async () => {
    const [{ objects: aObjects }, { objects: eObjects }] = await Promise.all([
      ACTUAL.list(),
      EXPECT.list(),
    ]);
    await Promise.all([
      ACTUAL.delete(aObjects.map((obj) => obj.key)),
      EXPECT.delete(eObjects.map((obj) => obj.key)),
    ]);
  };

  /** @type {[name: string, spec: () => Promise<void>][]} */
  const specs = [];
  const run = createRunner([ACTUAL, EXPECT]);

  specs.push([
    "R2.list() / R2.list(options)",
    async () => {
      let listRes = await run((R2) => R2.list());
      deepStrictEqual(listRes[0], listRes[1]);

      await run((R2) => R2.put("K1", "Hello"));
      await run((R2) => R2.put("K2", "World"));
      await run((R2) => R2.put("K3", "?!"));

      listRes = await run((R2) => R2.list({}));
      equalR2ObjectsResult(listRes[0], listRes[1]);
      listRes = await run((R2) => R2.list({ prefix: "K2" }));
      equalR2ObjectsResult(listRes[0], listRes[1]);
      listRes = await run((R2) => R2.list({ limit: 1 }));
      equalR2ObjectsResult(listRes[0], listRes[1]);
      listRes = await run((R2) => R2.list({ delimiter: "K" }));
      equalR2ObjectsResult(listRes[0], listRes[1]);
    },
  ]);

  specs.push([
    "R2.delete(key)",
    async () => {
      let deleteRes = await run((R2) => R2.delete("K1"));
      deepStrictEqual(deleteRes[0], deleteRes[1]);

      await run((R2) => R2.put("K1", "Hello"));

      deleteRes = await run((R2) => R2.delete("K1"));
      deepStrictEqual(deleteRes[0], deleteRes[1]);
    },
  ]);
  specs.push([
    "R2.delete(keys)",
    async () => {
      let deleteRes = await run((R2) => R2.delete([]));
      deepStrictEqual(deleteRes[0], deleteRes[1]);

      await run((R2) => R2.put("K1", "Hello"));
      await run((R2) => R2.put("K2", "World"));

      deleteRes = await run((R2) => R2.delete([]));
      deepStrictEqual(deleteRes[0], deleteRes[1]);
      deleteRes = await run((R2) => R2.delete(["K1", "K2"]));
      deepStrictEqual(deleteRes[0], deleteRes[1]);
    },
  ]);

  specs.push([
    "R2.head(key)",
    async () => {
      let headRes = await run((R2) => R2.head("K1"));
      deepStrictEqual(headRes[0], headRes[1]);

      await run((R2) => R2.put("K1", "Hello"));
      headRes = await run((R2) => R2.head("K1"));
      equalR2ObjectResult(headRes[0], headRes[1]);

      await run((R2) =>
        R2.put("K2", "Hello", { customMetadata: { foo: "bar" } }),
      );
      headRes = await run((R2) => R2.head("K2"));
      equalR2ObjectResult(headRes[0], headRes[1]);
    },
  ]);

  specs.push([
    "R2.put(key, value)",
    async () => {
      let putRes = await run((R2) => R2.put("K1", "Hello"));
      equalR2ObjectResult(putRes[0], putRes[1]);
      putRes = await run((R2) => R2.put("K2", new ArrayBuffer(256)));
      equalR2ObjectResult(putRes[0], putRes[1]);
      putRes = await run((R2) => R2.put("K3", new Uint32Array(32)));
      equalR2ObjectResult(putRes[0], putRes[1]);
      putRes = await run((R2) => R2.put("K4", null));
      equalR2ObjectResult(putRes[0], putRes[1]);
      putRes = await run((R2) => R2.put("K5", new Blob([])));
      equalR2ObjectResult(putRes[0], putRes[1]);
    },
  ]);

  specs.push([
    "R2.put(key, value, options)",
    async () => {
      let putRes = await run((R2) =>
        R2.put("K1", "123", { sha1: "0123456789".repeat(4) }),
      );
      equalRejectedResult(putRes[0], putRes[1]);
      await sleepAfterRejectedResult();

      putRes = await run((R2) =>
        R2.put("K1", "123", {
          sha1: "40bd001563085fc35165329ea1ff5c5ecbdbbeef",
        }),
      );
      equalR2ObjectResult(putRes[0], putRes[1]);
      const sha512 = await crypto.subtle.digest(
        "SHA-512",
        new TextEncoder().encode("123"),
      );
      putRes = await run((R2) => R2.put("K1", "123", { sha512 }));
      equalR2ObjectResult(putRes[0], putRes[1]);

      putRes = await run((R2) =>
        R2.put("K2", "456", { httpMetadata: { contentType: "text/html" } }),
      );
      equalR2ObjectResult(putRes[0], putRes[1]);

      putRes = await run((R2) =>
        R2.put("K3", '{ "x": 42 }', {
          httpMetadata: {
            contentType: "application/json",
            cacheExpiry: new Date(Date.now() + 10000),
          },
        }),
      );
      equalR2ObjectResult(putRes[0], putRes[1]);
      putRes = await run((R2) =>
        R2.put("K3", '{ "x": 42 }', {
          httpMetadata: new Headers([
            ["content-type", "application/json"],
            ["expires", new Date(Date.now() + 10000).toUTCString()],
          ]),
        }),
      );
      equalR2ObjectResult(putRes[0], putRes[1]);

      putRes = await run((R2) =>
        R2.put("K4", "xxx", { customMetadata: { x: "1", y: "2" } }),
      );
      equalR2ObjectResult(putRes[0], putRes[1]);
    },
  ]);

  specs.push([
    "R2.get(key)",
    async () => {
      let getRes = await run((R2) => R2.get("K1"));
      deepStrictEqual(getRes[0], getRes[1]);

      await run((R2) => R2.put("K1", "Hello"));

      getRes = await run((R2) => R2.get("K1"));
      equalR2ObjectBodyResult(getRes[0], getRes[1]);
    },
  ]);
  specs.push([
    "R2.get(key, options)",
    async () => {
      await run((R2) => R2.put("K1", "Hello"));

      let getRes = await run((R2) => R2.get("K1", {}));
      equalR2ObjectBodyResult(getRes[0], getRes[1]);

      getRes = await run((R2) =>
        R2.get("K1", { range: { offset: 1, length: 2 } }),
      );
      equalR2ObjectBodyResult(getRes[0], getRes[1]);

      getRes = await run((R2) => R2.get("K1", { range: { offset: 10 } }));
      equalRejectedResult(getRes[0], getRes[1]);
      await sleepAfterRejectedResult();

      await run((R2) => R2.put("K2", new Uint16Array([12, 34, 56, 78])));
      let getRes2 = await run((R2) =>
        R2.get("K2", {
          onlyIf: { uploadedBefore: new Date(Date.now() + 1000) },
        }),
      );
      equalR2ObjectBodyResult(getRes2[0], getRes2[1]);
      getRes2 = await run((R2) =>
        R2.get("K2", {
          onlyIf: { uploadedAfter: new Date(Date.now() + 1000) },
        }),
      );
      equalR2ObjectResult(getRes2[0], getRes2[1]);

      await run((R2) => R2.put("K3", "yoyoyo"));
      let getRes3 = await run((R2) =>
        R2.get("K3", { onlyIf: new Headers([["If-Match", '"0000"']]) }),
      );
      equalR2ObjectResult(getRes3[0], getRes3[1]);
    },
  ]);

  specs.push([
    "R2 key can be any string",
    async () => {
      const validKeys = [
        "",
        ".",
        "..",
        "🐣=NonASCII",
        "key/needs#to+be&encoded?but:ok!",
        "key/with/./and/..",
      ];
      for (const K of validKeys) {
        let putRes = await run((R2) => R2.put(K, "text"));
        equalR2ObjectResult(putRes[0], putRes[1]);

        let getRes = await run((R2) => R2.get(K));
        equalR2ObjectBodyResult(getRes[0], getRes[1]);

        let deleteRes = await run((R2) => R2.delete(K));
        deepStrictEqual(deleteRes[0], deleteRes[1]);
      }
    },
  ]);

  specs.push([
    "R2.createMultipartUpload(key)/ R2.createMultipartUpload(key, options)",
    async () => {
      let createRes = await run((R2) => R2.createMultipartUpload("K1-1"));
      equalR2MultipartUploadResult(createRes[0], createRes[1]);
      // Same key again works
      createRes = await run((R2) => R2.createMultipartUpload("K1-1"));
      equalR2MultipartUploadResult(createRes[0], createRes[1]);

      createRes = await run((R2) =>
        R2.createMultipartUpload("K1-2", {
          httpMetadata: { contentType: "image/webp" },
          customMetadata: { foo: "bar" },
        }),
      );
      equalR2MultipartUploadResult(createRes[0], createRes[1]);
    },
  ]);

  specs.push([
    "R2.resumeMultipartUpload(key, uploadId)",
    async () => {
      let resumeRes = await run((R2) =>
        R2.createMultipartUpload("K2-1").then((m) =>
          R2.resumeMultipartUpload(m.key, m.uploadId),
        ),
      );
      equalR2MultipartUploadResult(resumeRes[0], resumeRes[1]);

      resumeRes = await run((R2) =>
        R2.resumeMultipartUpload("K2-2", "invalid"),
      );
      equalR2MultipartUploadResult(resumeRes[0], resumeRes[1]);
    },
  ]);

  specs.push([
    "R2MultipartUpload.uploadPart(partNumber, value)",
    async () => {
      let partRes = await run((R2) =>
        R2.createMultipartUpload("K3-1").then((m) => m.uploadPart(1, "P1")),
      );
      equalR2UploadedPart(partRes[0], partRes[1]);

      partRes = await run((R2) =>
        R2.createMultipartUpload("K3-2").then((m) =>
          m.uploadPart(2, new ArrayBuffer(512)),
        ),
      );
      equalR2UploadedPart(partRes[0], partRes[1]);

      partRes = await run((R2) =>
        R2.resumeMultipartUpload("K3-3", "invalid").uploadPart(1, "P1"),
      );
      equalRejectedResult(partRes[0], partRes[1]);
      await sleepAfterRejectedResult();
    },
  ]);

  specs.push([
    "R2MultipartUpload.abort()",
    async () => {
      let abortRes = await run((R2) =>
        R2.createMultipartUpload("K4-1").then((m) => m.abort()),
      );
      deepStrictEqual(abortRes[0], abortRes[1]);

      abortRes = await run((R2) =>
        R2.resumeMultipartUpload("K4-2", "invalid").abort(),
      );
      equalRejectedResult(abortRes[0], abortRes[1]);
      await sleepAfterRejectedResult();
    },
  ]);

  specs.push([
    "R2MultipartUpload.complete(uploadedParts)",
    async () => {
      let completeRes = await run((R2) =>
        R2.createMultipartUpload("K5-1").then((m) => m.complete([])),
      );
      equalR2ObjectResult(completeRes[0], completeRes[1]);

      completeRes = await run((R2) =>
        R2.createMultipartUpload("K5-2").then(async (m) => {
          const p1 = await m.uploadPart(1, "P1");
          const p2 = await m.uploadPart(2, "P2");
          return m.complete([p1, p2]);
        }),
      );
      equalR2ObjectResult(completeRes[0], completeRes[1]);

      completeRes = await run((R2) =>
        R2.resumeMultipartUpload("K5-3", "invalid").complete([]),
      );
      equalRejectedResult(completeRes[0], completeRes[1]);
      await sleepAfterRejectedResult();
    },
  ]);

  return { beforeEach, specs };
};
