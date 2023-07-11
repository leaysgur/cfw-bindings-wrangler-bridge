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
const equalR2Checksums = (actual, expect) => {
  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());
  deepStrictEqual(actual.md5, expect.md5);
  deepStrictEqual(actual.toJSON(), expect.toJSON());
};

/**
 * @param {R2HTTPMetadata | undefined} actual
 * @param {R2HTTPMetadata | undefined} expect
 */
const equalHttpMetadata = (actual, expect) => {
  if (actual === undefined || expect === undefined) {
    deepStrictEqual(actual, expect);
    return;
  }

  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  deepStrictEqual(typeof actual.cacheExpiry, typeof expect.cacheExpiry);
};

/**
 * @param {R2Object} actual
 * @param {R2Object} expect
 */
const equalR2Object = (actual, expect) => {
  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  deepStrictEqual(actual.key, expect.key);
  deepStrictEqual(typeof actual.version, typeof expect.version);
  deepStrictEqual(actual.size, expect.size);
  deepStrictEqual(actual.etag, expect.etag);
  deepStrictEqual(actual.httpEtag, expect.httpEtag);
  equalR2Checksums(actual.checksums, expect.checksums);
  deepStrictEqual(typeof actual.uploaded, typeof expect.uploaded);
  equalHttpMetadata(actual.httpMetadata, expect.httpMetadata);
  deepStrictEqual(actual.customMetadata, expect.customMetadata);
};

/**
 * @param {R2ObjectBody} actual
 * @param {R2ObjectBody} expect
 */
const equalR2ObjectBody = (actual, expect) => {
  equalR2Object(actual, expect);
  deepStrictEqual(actual.bodyUsed, expect.bodyUsed);
  deepStrictEqual(typeof actual.body, typeof expect.body);
};

/**
 * @param {R2Objects} actual
 * @param {R2Objects} expect
 */
const equalR2Objects = (actual, expect) => {
  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  deepStrictEqual(actual.truncated, expect.truncated);
  deepStrictEqual(actual.delimitedPrefixes, expect.delimitedPrefixes);
  deepStrictEqual(actual.objects.length, expect.objects.length);
  for (const idx of expect.objects.keys()) {
    equalR2Object(actual.objects[idx], expect.objects[idx]);
  }
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
        deepStrictEqual(actual, expect);
      },
    ],
    [
      "R2.head(k) -> null",
      async () => {
        const [actual, expect] = await run((R2) => R2.head(KEY1));
        deepStrictEqual(actual, expect);
      },
    ],
    [
      "R2.get(k) -> null",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1));
        deepStrictEqual(actual, expect);
      },
    ],
    [
      "R2.delete(k)",
      async () => {
        const [actual, expect] = await run((R2) => R2.delete(KEY1));
        deepStrictEqual(actual, expect);
      },
    ],

    [
      "R2.put(k, v) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) => R2.put(KEY1, "OK"));
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Object(actual.value, expect.value);
      },
    ],
    [
      "R2.head(k) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) => R2.head(KEY1));
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Object(actual.value, expect.value);
      },
    ],
    [
      "R2.get(k) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1));
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2ObjectBody(actual.value, expect.value);
      },
    ],
    [
      "R2.get(k, {}) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1, {}));
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2ObjectBody(actual.value, expect.value);
      },
    ],
    [
      "R2.get(k, { range }) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { range: { offset: 1 } })
        );
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2ObjectBody(actual.value, expect.value);
      },
    ],
    [
      "R2.get(k, { range }) -> throws",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { range: { offset: 100 } })
        );
        deepStrictEqual(actual, expect);
      },
    ],
    [
      "R2.get(k, { onlyIf: { uploadBefore } }) -> R2ObjectBody",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { onlyIf: { uploadedBefore: new Date() } })
        );
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2ObjectBody(actual.value, expect.value);
      },
    ],
    [
      "R2.get(k, { onlyIf: { uploadAfter } }) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { onlyIf: { uploadedAfter: new Date() } })
        );
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Object(actual.value, expect.value);
      },
    ],
    [
      "R2.list() -> list",
      async () => {
        const [actual, expect] = await run((R2) => R2.list());
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Objects(actual.value, expect.value);
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
              // `workerd` throws `TypeError`...
              // https://github.com/cloudflare/workerd/issues/851
              // cacheExpiry: new Date(),
            },
          })
        );
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Object(actual.value, expect.value);
      },
    ],
    [
      "R2Object.writeHttpMetadata()",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY2));
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
        deepStrictEqual(actual, expect);
      },
    ],

    [
      "R2.put(k, v, { sha1 }) -> R2Object",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.put(KEY4, "123", {
            sha1: "40bd001563085fc35165329ea1ff5c5ecbdbbeef",
          })
        );
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Object(actual.value, expect.value);
      },
    ],
    [
      "R2ObjectBody.arrayBuffer() -> ArrayBuffer",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY4));
        if (actual.status === "fulfilled" && expect.status === "fulfilled") {
          equalR2ObjectBody(actual.value, expect.value);

          const [aAB, eAB] = await Promise.all([
            actual.value.arrayBuffer(),
            expect.value.arrayBuffer(),
          ]);
          deepStrictEqual(aAB, eAB);

          equalR2ObjectBody(actual.value, expect.value);
        }
      },
    ],

    [
      "R2.list({ limit }) -> list",
      async () => {
        const [actual, expect] = await run((R2) => R2.list({ limit: 2 }));
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Objects(actual.value, expect.value);
      },
    ],
    [
      "R2.delete(keys)",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.delete([KEY1, KEY2, KEY3, KEY4])
        );
        deepStrictEqual(actual, expect);
      },
    ],
    [
      "R2.list() -> empty",
      async () => {
        const [actual, expect] = await run((R2) => R2.list());
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          equalR2Objects(actual.value, expect.value);
      },
    ],

    [
      "R2.head(non-ASCII) -> null",
      async () => {
        const [actual, expect] = await run((R2) => R2.head("🐧"));
        if (actual.status === "fulfilled" && expect.status === "fulfilled")
          deepStrictEqual(actual.value, expect.value);
      },
    ],
  ];
};
