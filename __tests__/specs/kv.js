// @ts-check
import { deepStrictEqual } from "node:assert";

/**
 * @param {KVNamespace} ACTUAL
 * @param {KVNamespace} EXPECT
 */
export const before = async (ACTUAL, EXPECT) => {
  const [{ keys: aKeys }, { keys: eKeys }] = await Promise.all([
    ACTUAL.list(),
    EXPECT.list(),
  ]);
  await Promise.all([
    ...aKeys.map((key) => ACTUAL.delete(key.name)),
    ...eKeys.map((key) => EXPECT.delete(key.name)),
  ]);
};

// KV specs are simple.
// Just run the same operation and check results are also the same or NOT.
// Every return values are JSON serializable and no dynamic values.

/**
 * @param {KVNamespace} ACTUAL
 * @param {KVNamespace} EXPECT
 * @returns {[name: string, spec: () => Promise<void>][]}
 */
export const createSpecs = (ACTUAL, EXPECT) => {
  const [KEY1, KEY2, KEY3, KEY4] = ["K:1", "K:2", "K:3", "/key/#/4"];

  /** @type {[name: string, spec: (KV: KVNamespace) => Promise<any>][]} */
  const specs = [
    ["KV.list() -> empty", (KV) => KV.list()],
    ["KV.delete(k) -> noop", (KV) => KV.delete(KEY1)],
    ["KV.get(k) -> null", (KV) => KV.get(KEY1)],

    ["KV.put(k, v)", (KV) => KV.put(KEY1, "HELLO")],
    ["KV.get(k) -> v", (KV) => KV.get(KEY1)],
    ["KV.get(k, {}) -> v", (KV) => KV.get(KEY1, {})],
    ["KV.get(k, { cacheTtl }) -> v", (KV) => KV.get(KEY1, { cacheTtl: 60 })],

    ["KV.delete(k)", (KV) => KV.delete(KEY1)],
    ["KV.get(k) -> null", (KV) => KV.get(KEY1)],

    [
      "KV.put(k, v)",
      (KV) => KV.put(KEY2, JSON.stringify({ hello: { world: 42 } })),
    ],
    ['KV.get(k, "json") -> JSON', (KV) => KV.get(KEY2, "json")],
    [
      'KV.get(k, { type: "stream" }) -> ReadableStream',
      (KV) => KV.get(KEY2, { type: "stream" }),
    ],

    [
      "KV.put(k, v, { metadata })",
      (KV) => KV.put(KEY3, "foo", { metadata: { foo: "bar" } }),
    ],
    [
      "KV.getWithMetadata(k) -> TEXT w/ metadata",
      (KV) => KV.getWithMetadata(KEY3),
    ],

    ["KV.put(k, ArrayBufferView)", (KV) => KV.put(KEY4, new Uint32Array())],
    [
      'KV.get(k, "arrayBuffer") -> ArrayBuffer',
      (KV) => KV.get(KEY4, "arrayBuffer"),
    ],

    ["KV.list() -> list", (KV) => KV.list()],
    ["KV.list({ limit })", (KV) => KV.list({ limit: 1 })],
    ["KV.list({ prefix })", (KV) => KV.list({ prefix: "K:" })],

    ['KV.put("", v) -> throws', (KV) => KV.put("", "invalid")],
    ['KV.put(".", v) -> throws', (KV) => KV.put(".", "invalid")],
    ['KV.put("..", v) -> throws', (KV) => KV.put("..", "invalid")],
    ["KV.get(non-ASCII) -> null", (KV) => KV.get("🐧")],
  ];

  return specs.map(([name, spec]) => [
    name,
    async () => {
      const [actual, expect] = await Promise.allSettled([
        spec(ACTUAL),
        spec(EXPECT),
      ]);

      deepStrictEqual(actual.status, expect.status);

      if (actual.status === "fulfilled" && expect.status === "fulfilled") {
        deepStrictEqual(actual.value, expect.value);
      }
      if (actual.status === "rejected" && expect.status === "rejected") {
        deepStrictEqual(actual.reason.message, expect.reason.message);
        // IDKW but sometimes continuous spec exact after rejected one fails
        // with [actual] Connection lost error.
        await new Promise((r) => setTimeout(r, 10));
      }
    },
  ]);
};
