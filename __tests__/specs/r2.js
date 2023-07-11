// @ts-check
import { deepStrictEqual } from "node:assert";

/**
 * @param {R2Bucket} ACTUAL
 * @param {R2Bucket} EXPECT
 */
export const before = async (ACTUAL, EXPECT) => {
  const [{ objects: aObjects }, { objects: eObjects }] = await Promise.all([
    ACTUAL.list(),
    EXPECT.list(),
  ]);
  await Promise.all([
    ACTUAL.delete(aObjects.map((obj) => obj.key)),
    EXPECT.delete(eObjects.map((obj) => obj.key)),
  ]);
};

// R2 specs are more verbose.
// `R2Object` contains dynamic values like `version`, `uploaded`, etc,
// these values make `deepStrictEqual(a, e)` fails.

/** @param {[R2Bucket, R2Bucket]} bindings */
const createRunner =
  ([ACTUAL, EXPECT]) =>
    /**
     * @param {(R2: R2Bucket) => Promise<unknown>} spec
     * @returns {Promise<PromiseSettledResult<any>[]>}
     */
    async (spec) =>
      Promise.allSettled([spec(ACTUAL), spec(EXPECT)]);

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
  if (actual === undefined || expect === undefined) {
    deepStrictEqual(actual, expect);
    return;
  }

  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  deepStrictEqual(typeof actual.cacheExpiry, typeof expect.cacheExpiry);
};

/**
 * @param {PromiseSettledResult<R2Object>} aRes
 * @param {PromiseSettledResult<R2Object>} eRes
 */
const equalR2ObjectResult = (aRes, eRes) => {
  deepStrictEqual(aRes.status, eRes.status);

  if (aRes.status === "rejected" && eRes.status === "rejected") {
    deepStrictEqual(aRes.reason.message, eRes.reason.message);
  }
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled") {
    _equalR2Object(aRes.value, eRes.value);
  }
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
};

/**
 * @param {PromiseSettledResult<R2ObjectBody>} aRes
 * @param {PromiseSettledResult<R2ObjectBody>} eRes
 */
const equalR2ObjectBodyResult = (aRes, eRes) => {
  deepStrictEqual(aRes.status, eRes.status);

  if (aRes.status === "rejected" && eRes.status === "rejected") {
    deepStrictEqual(aRes.reason.message, eRes.reason.message);
  }
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled") {
    _equalR2ObjectBody(aRes.value, eRes.value);
  }
};
/**
 * @param {R2ObjectBody} actual
 * @param {R2ObjectBody} expect
 */
const _equalR2ObjectBody = (actual, expect) => {
  _equalR2Object(actual, expect);
  deepStrictEqual(actual.bodyUsed, expect.bodyUsed);
  deepStrictEqual(typeof actual.body, typeof expect.body);
};

/**
 * @param {PromiseSettledResult<R2Objects>} aRes
 * @param {PromiseSettledResult<R2Objects>} eRes
 */
const equalR2ObjectsResult = (aRes, eRes) => {
  deepStrictEqual(aRes.status, eRes.status);

  if (aRes.status === "rejected" && eRes.status === "rejected") {
    deepStrictEqual(aRes.reason.message, eRes.reason.message);
  }
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled") {
    _equalR2Objects(aRes.value, eRes.value);
  }
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
 * @param {PromiseSettledResult<any>} aRes
 * @param {PromiseSettledResult<any>} eRes
 */
const equalResult = (aRes, eRes) => {
  deepStrictEqual(aRes.status, eRes.status);

  if (aRes.status === "rejected" && eRes.status === "rejected") {
    deepStrictEqual(aRes.reason.message, eRes.reason.message);
  }
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled") {
    deepStrictEqual(aRes.value, eRes.value);
  }
};

/** @param {string} hex */
const hexToArrayBuffer = (hex) => {
  const view = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  return view.buffer;
};

/**
 * @param {R2Bucket} ACTUAL
 * @param {R2Bucket} EXPECT
 * @returns {[name: string, spec: () => Promise<void>][]}
 */
export const createSpecs = (ACTUAL, EXPECT) => {
  const [KEY1, KEY2, KEY3, KEY4] = ["R:1", "R:2", "R:3", "/key/#/4"];
  const run = createRunner([ACTUAL, EXPECT]);

  return [
    [
      "R2.list() -> empty",
      async () => {
        const [actual, expect] = await run((R2) => R2.list());
        equalResult(actual, expect);
      },
    ],
    [
      "R2.head(k) -> null",
      async () => {
        const [actual, expect] = await run((R2) => R2.head(KEY1));
        equalResult(actual, expect);
      },
    ],
    [
      "R2.get(k) -> null",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1));
        equalResult(actual, expect);
      },
    ],
    [
      "R2.delete(k)",
      async () => {
        const [actual, expect] = await run((R2) => R2.delete(KEY1));
        equalResult(actual, expect);
      },
    ],

    [
      "R2.put(k, v) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) => R2.put(KEY1, "OK"));
        equalR2ObjectResult(actual, expect);
      },
    ],
    [
      "R2.head(k) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) => R2.head(KEY1));
        equalR2ObjectResult(actual, expect);
      },
    ],
    [
      "R2.get(k) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1));
        equalR2ObjectBodyResult(actual, expect);
      },
    ],
    [
      "R2.get(k, {}) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1, {}));
        equalR2ObjectBodyResult(actual, expect);
      },
    ],
    [
      "R2.get(k, { range }) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { range: { offset: 1 } })
        );
        equalR2ObjectBodyResult(actual, expect);
      },
    ],
    [
      "R2.get(k, { range }) -> throws",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { range: { offset: 100 } })
        );
        equalResult(actual, expect);
      },
    ],
    [
      "R2.get(k, { onlyIf: { uploadBefore } }) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { onlyIf: { uploadedBefore: new Date() } })
        );
        equalR2ObjectBodyResult(actual, expect);
      },
    ],
    [
      "R2.get(k, { onlyIf: { uploadAfter } }) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { onlyIf: { uploadedAfter: new Date() } })
        );
        equalR2ObjectResult(actual, expect);
      },
    ],
    [
      "R2.get(k, { onlyIf: Headers }) -> R2Object",
      async () => {
        const headers = new Headers([["Content-Type", "text/plain"]]);
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { onlyIf: headers })
        );
        equalR2ObjectResult(actual, expect);
      },
    ],
    [
      "R2.list() -> list",
      async () => {
        const [actual, expect] = await run((R2) => R2.list());
        equalR2ObjectsResult(actual, expect);
      },
    ],

    [
      "R2.put(k, v, { httpMetadata })",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.put(KEY2, "META", {
            httpMetadata: {
              contentType: "text/plain",
              cacheControl: "max-age=3600",
              // https://github.com/cloudflare/workerd/issues/851
              // cacheExpiry: new Date(),
            },
          })
        );
        equalR2ObjectResult(actual, expect);
      },
    ],
    [
      "R2Object.writeHttpMetadata()",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY2));

        deepStrictEqual(actual.status, expect.status);
        if (actual.status === "rejected" && expect.status === "rejected") {
          deepStrictEqual(actual.reason.message, expect.reason.message);
        }
        if (actual.status === "fulfilled" && expect.status === "fulfilled") {
          const [aHeaders, eHeaders] = [new Headers(), new Headers()];
          actual.value.writeHttpMetadata(aHeaders);
          expect.value.writeHttpMetadata(eHeaders);
          deepStrictEqual(aHeaders, eHeaders);
        }
      },
    ],

    [
      "R2.put(k, v, { onlyIf }) -> null",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.put(KEY3, "foo", {
            onlyIf: { etagMatches: "xxx" },
          })
        );
        equalResult(actual, expect);
      },
    ],

    [
      "R2.put(k, v, { sha1: string }) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.put(KEY4, "123", {
            sha1: "40bd001563085fc35165329ea1ff5c5ecbdbbeef",
          })
        );
        equalR2ObjectResult(actual, expect);
      },
    ],
    [
      "R2.put(k, v, { sha256: ArrayBuffer }) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.put(KEY4, "123", {
            sha256: hexToArrayBuffer(
              "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
            ),
          })
        );
        equalR2ObjectResult(actual, expect);
      },
    ],
    [
      "R2ObjectBody.text() -> TEXT",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY4));

        // `bodyUsed: false`
        equalR2ObjectBodyResult(actual, expect);
        if (actual.status === "fulfilled" && expect.status === "fulfilled") {
          const [aAB, eAB] = await Promise.all([
            actual.value.text(),
            expect.value.text(),
          ]);
          deepStrictEqual(aAB, eAB);
        }
        // `bodyUsed: true`
        equalR2ObjectBodyResult(actual, expect);
      },
    ],

    [
      "R2.list({ limit }) -> list",
      async () => {
        const [actual, expect] = await run((R2) => R2.list({ limit: 2 }));
        equalR2ObjectsResult(actual, expect);
      },
    ],
    [
      "R2.delete(keys)",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.delete([KEY1, KEY2, KEY3, KEY4])
        );
        equalResult(actual, expect);
      },
    ],
    [
      "R2.list() -> empty",
      async () => {
        const [actual, expect] = await run((R2) => R2.list());
        equalR2ObjectsResult(actual, expect);
      },
    ],

    [
      "R2.head(non-ASCII) -> null",
      async () => {
        const [actual, expect] = await run((R2) => R2.head("🐧"));
        equalResult(actual, expect);
      },
    ],
  ];
};
