// @ts-check
import { deepStrictEqual } from "node:assert";
import {
  createRunner,
  equalRejectedResult,
  sleepAfterRejectedResult,
} from "../test-utils.js";

/** @param {[KVNamespace, KVNamespace]} bindings */
export const createSpecs = ([ACTUAL, EXPECT]) => {
  const beforeEach = async () => {
    const [{ keys: aKeys }, { keys: eKeys }] = await Promise.all([
      ACTUAL.list(),
      EXPECT.list(),
    ]);
    await Promise.all([
      ...aKeys.map((key) => ACTUAL.delete(key.name)),
      ...eKeys.map((key) => EXPECT.delete(key.name)),
    ]);
  };

  /** @type {[name: string, spec: () => Promise<void>][]} */
  const specs = [];
  const run = createRunner([ACTUAL, EXPECT]);

  specs.push([
    "KV.list() / KV.list(options)",
    async () => {
      let listRes = await run((KV) => KV.list());
      deepStrictEqual(listRes[0], listRes[1]);

      await run((KV) => KV.put("K1", "Hello"));
      await run((KV) => KV.put("K2", "World"));
      await run((KV) => KV.put("K3", "!!"));

      listRes = await run((KV) => KV.list({}));
      deepStrictEqual(listRes[0], listRes[1]);
      listRes = await run((KV) => KV.list({ prefix: null }));
      deepStrictEqual(listRes[0], listRes[1]);
      listRes = await run((KV) => KV.list({ prefix: "K2" }));
      deepStrictEqual(listRes[0], listRes[1]);
      listRes = await run((KV) => KV.list({ limit: 1 }));
      deepStrictEqual(listRes[0], listRes[1]);
      listRes = await run((KV) => KV.list({ cursor: null }));
      deepStrictEqual(listRes[0], listRes[1]);
    },
  ]);

  specs.push([
    "KV.delete(key)",
    async () => {
      await run((KV) => KV.put("K1", "Hello"));

      let deleteRes = await run((KV) => KV.delete("K1"));
      deepStrictEqual(deleteRes[0], deleteRes[1]);

      deleteRes = await run((KV) => KV.delete("K2"));
      deepStrictEqual(deleteRes[0], deleteRes[1]);
    },
  ]);

  specs.push([
    "KV.put(key, value)",
    async () => {
      let putRes = await run((KV) => KV.put("K1", "text"));
      deepStrictEqual(putRes[0], putRes[1]);
      putRes = await run((KV) => KV.put("K2", '{ "json": ["foo", "bar"]}'));
      deepStrictEqual(putRes[0], putRes[1]);
      putRes = await run((KV) => KV.put("K3", new ArrayBuffer(8)));
      deepStrictEqual(putRes[0], putRes[1]);
      putRes = await run((KV) => KV.put("K3", new Int32Array(128)));
      deepStrictEqual(putRes[0], putRes[1]);
    },
  ]);
  specs.push([
    "KV.put(key, value, options)",
    async () => {
      let putRes = await run((KV) =>
        KV.put("K1", "...", { metadata: { foo: "bar" } }),
      );
      deepStrictEqual(putRes[0], putRes[1]);
    },
  ]);

  specs.push([
    "KV.get(key)",
    async () => {
      let getRes = await run((KV) => KV.get("K1"));
      deepStrictEqual(getRes[0], getRes[1]);

      await run((KV) => KV.put("K1", "text"));

      getRes = await run((KV) => KV.get("K1"));
      deepStrictEqual(getRes[0], getRes[1]);
    },
  ]);
  specs.push([
    "KV.get(key, options)",
    async () => {
      await run((KV) => KV.put("K1", "text"));
      await run((KV) => KV.put("K2", '{ "json": ["foo", "bar"]}'));
      await run((KV) => KV.put("K3", new ArrayBuffer(8)));

      let getRes = await run((KV) => KV.get("K1"));
      deepStrictEqual(getRes[0], getRes[1]);
      getRes = await run((KV) => KV.get("K1", {}));
      deepStrictEqual(getRes[0], getRes[1]);
      getRes = await run((KV) => KV.get("K1", { cacheTtl: 1000 }));
      deepStrictEqual(getRes[0], getRes[1]);

      let getRes2 = await run((KV) => KV.get("K2", "json"));
      deepStrictEqual(getRes2[0], getRes2[1]);
      getRes2 = await run((KV) => KV.get("K2", { type: "json" }));
      deepStrictEqual(getRes2[0], getRes2[1]);

      let getRes3 = await run((KV) => KV.get("K3", "arrayBuffer"));
      deepStrictEqual(getRes3[0], getRes3[1]);

      let getRes4 = await run((KV) => KV.get("K3", { type: "stream" }));
      deepStrictEqual(getRes4[0], getRes4[1]);
    },
  ]);

  specs.push([
    "KV.getWithMetadata(key)",
    async () => {
      let getRes = await run((KV) => KV.getWithMetadata("K1"));
      deepStrictEqual(getRes[0], getRes[1]);

      await run((KV) => KV.put("K1", "text", { metadata: { foo: "bar" } }));
      getRes = await run((KV) => KV.getWithMetadata("K1"));
      deepStrictEqual(getRes[0], getRes[1]);
    },
  ]);

  specs.push([
    "KV key can be any string including non-ASCII characters",
    async () => {
      const validKeys = [
        "a/b/c",
        "key/needs#to+be&encoded?but:ok!",
        "key/with/./and/..",
        "🐧", // Non-ASCII
      ];

      for (const K of validKeys) {
        let putRes = await run((KV) => KV.put(K, "text"));
        deepStrictEqual(putRes[0], putRes[1]);
        let getRes = await run((KV) => KV.get(K));
        deepStrictEqual(getRes[0], getRes[1]);
        let deleteRes = await run((KV) => KV.delete(K));
        deepStrictEqual(deleteRes[0], deleteRes[1]);
      }
    },
  ]);

  specs.push([
    'KV key can not be "", "." and ".."',
    async () => {
      const invalidKeys = ["", ".", ".."];
      for (const K of invalidKeys) {
        let putRes = await run((KV) => KV.put(K, "text"));
        equalRejectedResult(putRes[0], putRes[1]);
        await sleepAfterRejectedResult();

        let getRes = await run((KV) => KV.get(K));
        equalRejectedResult(getRes[0], getRes[1]);
        await sleepAfterRejectedResult();

        let deleteRes = await run((KV) => KV.delete(K));
        equalRejectedResult(deleteRes[0], deleteRes[1]);
        await sleepAfterRejectedResult();
      }
    },
  ]);

  return { beforeEach, specs };
};
