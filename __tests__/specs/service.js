// @ts-check
import { deepStrictEqual } from "node:assert";
import { createRunner } from "./utils.js";

/** @param {[Fetcher, Fetcher]} bindings */
export const createSpecs = ([ACTUAL, EXPECT]) => {
  const beforeEach = async () => {};

  /** @type {[name: string, spec: () => Promise<void>][]} */
  const specs = [];
  const run = createRunner([ACTUAL, EXPECT]);

  specs.push([
    "SERVICE.fetch()",
    async () => {
      let fetchRes = await run(async (SERVICE) => {
        const res = await SERVICE.fetch("https://example.com");
        return res.text();
      });
      deepStrictEqual(fetchRes[0], fetchRes[1]);

      fetchRes = await run(async (SERVICE) => {
        const res = await SERVICE.fetch(new Request("https://example.com"));
        return res.text();
      });
      deepStrictEqual(fetchRes[0], fetchRes[1]);
    },
  ]);

  return { beforeEach, specs };
};
