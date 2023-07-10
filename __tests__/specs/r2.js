// @ts-check
import { deepStrictEqual, strictEqual } from "node:assert";

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
// these make `deepStrictEqual(a, e)` fails.

const randomKey = () => "R:" + Math.random();

/** @param {[R2Bucket, R2Bucket]} bindings */
const createRunner =
  ([ACTUAL, EXPECT]) =>
    /**
     * @param {(R2: R2Bucket) => Promise<unknown>} spec
     * @returns {Promise<[any, any]>}
     */
    async (spec) =>
      Promise.all([spec(ACTUAL), spec(EXPECT)]);

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
 * @param {R2Object} actual
 * @param {R2Object} expect
 */
const equalR2Object = (actual, expect) => {
  const [aKeys, eKeys] = [Object.keys(actual), Object.keys(expect)];
  deepStrictEqual(aKeys.sort(), eKeys.sort());

  strictEqual(actual.key, expect.key);
  strictEqual(typeof actual.version, typeof expect.version);
  strictEqual(actual.size, expect.size);
  strictEqual(actual.etag, expect.etag);
  strictEqual(actual.httpEtag, expect.httpEtag);
  equalR2Checksums(actual.checksums, expect.checksums);
  strictEqual(typeof actual.uploaded, typeof expect.uploaded);
  deepStrictEqual(actual.httpMetadata, expect.httpMetadata);
  deepStrictEqual(actual.customMetadata, expect.customMetadata);
};

/**
 * @param {R2ObjectBody} actual
 * @param {R2ObjectBody} expect
 */
const equalR2ObjectBody = (actual, expect) => {
  equalR2Object(actual, expect);
  strictEqual(actual.bodyUsed, expect.bodyUsed);
  strictEqual(typeof actual.body, typeof expect.body);
};


/**
 * @param {R2Bucket} ACTUAL
 * @param {R2Bucket} EXPECT
 * @returns {[name: string, spec: () => Promise<void>][]}
 */
export const createSpecs = (ACTUAL, EXPECT) => {
  const KEY1 = randomKey();
  const run = createRunner([ACTUAL, EXPECT]);

  return [
    [
      "R2.list()",
      async () => {
        const [actual, expect] = await run((R2) => R2.list());
        // empty `objects`
        deepStrictEqual(actual, expect);
      },
    ],
    [
      "R2.head(k)",
      async () => {
        const [actual, expect] = await run((R2) => R2.head(KEY1));
        // `null`
        deepStrictEqual(actual, expect);
      },
    ],
    [
      "R2.get(k)",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1));
        // `null`
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
      "R2.put(k, v)",
      async () => {
        const [actual, expect] = await run((R2) => R2.put(KEY1, "OK"));
        equalR2Object(actual, expect);
      },
    ],
    [
      "R2.head(k)",
      async () => {
        const [actual, expect] = await run((R2) => R2.head(KEY1));
        equalR2Object(actual, expect);
      },
    ],
    [
      "R2.get(k)",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1));
        equalR2ObjectBody(actual, expect);
      },
    ],
    [
      "R2.get(k, {})",
      async () => {
        const [actual, expect] = await run((R2) => R2.get(KEY1, {}));
        equalR2ObjectBody(actual, expect);
      },
    ],
    [
      "R2.get(k, { range })",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { range: { offset: 1 } })
        );
        equalR2ObjectBody(actual, expect);
      },
    ],
    [
      "R2.get(k, { onlyIf: { uploadBefore } })",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { onlyIf: { uploadedBefore: new Date() } })
        );
        equalR2ObjectBody(actual, expect);
      },
    ],
    [
      "R2.get(k, { onlyIf: { uploadAfter } })",
      async () => {
        const [actual, expect] = await run((R2) =>
          R2.get(KEY1, { onlyIf: { uploadedAfter: new Date() } })
        );
        // null
        strictEqual(actual, expect);
      },
    ],

    // TODO: writeHttpMetadata
  ];
};
