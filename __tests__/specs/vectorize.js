// @ts-check
import { deepStrictEqual } from "node:assert";
import { createRunner } from "../test-utils.js";

/** @param {[VectorizeIndex, VectorizeIndex]} bindings */
export const createSpecs = ([ACTUAL, EXPECT]) => {
  const beforeEach = async () => {};

  /** @type {[name: string, spec: () => Promise<void>][]} */
  const specs = [];
  const run = createRunner([ACTUAL, EXPECT]);

  specs.push([
    "VECTORIZE.insert(vectors)",
    async () => {
      let insertRes = await run((VECTORIZE) =>
        VECTORIZE.insert([
          { id: "123", values: [32.4, 6.5, 11.2, 10.3, 87.9] },
          { id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5] },
        ]),
      );
      deepStrictEqual(insertRes[0], insertRes[1]);

      insertRes = await run((VECTORIZE) =>
        VECTORIZE.insert([
          { id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5] },
          { id: "798", values: [1, 2, 3, 4, 5] },
        ]),
      );
      deepStrictEqual(insertRes[0], insertRes[1]);
    },
  ]);

  specs.push([
    "VECTORIZE.upsert(vectors)",
    async () => {
      let upsertRes = await run((VECTORIZE) =>
        VECTORIZE.upsert([
          { id: "123", values: [0, 0, 0, 0, 0] },
          { id: "456", values: [1, 1, 1, 1, 1] },
        ]),
      );
      deepStrictEqual(upsertRes[0], upsertRes[1]);
    },
  ]);

  specs.push([
    "VECTORIZE.describe()",
    async () => {
      let describeRes = await run((VECTORIZE) => VECTORIZE.describe());
      deepStrictEqual(describeRes[0], describeRes[1]);
    },
  ]);

  specs.push([
    "VECTORIZE.query(vector, options)",
    async () => {
      let queryRes = await run((VECTORIZE) =>
        VECTORIZE.query([1, 1, 1, 1, 1], {}),
      );
      deepStrictEqual(queryRes[0], queryRes[1]);

      queryRes = await run((VECTORIZE) =>
        VECTORIZE.query([1, 1, 1, 1, 1], { topK: 2 }),
      );
      deepStrictEqual(queryRes[0], queryRes[1]);

      queryRes = await run((VECTORIZE) =>
        VECTORIZE.query([1, 1, 1, 1, 1], { returnVectors: true }),
      );
      deepStrictEqual(queryRes[0], queryRes[1]);
    },
  ]);

  specs.push([
    "VECTORIZE.getByIds(ids)",
    async () => {
      let getByIdsRes = await run((VECTORIZE) => VECTORIZE.getByIds([]));
      deepStrictEqual(getByIdsRes[0], getByIdsRes[1]);

      getByIdsRes = await run((VECTORIZE) => VECTORIZE.getByIds(["123"]));
      deepStrictEqual(getByIdsRes[0], getByIdsRes[1]);

      getByIdsRes = await run((VECTORIZE) =>
        VECTORIZE.getByIds(["456", "789", "012"]),
      );
      deepStrictEqual(getByIdsRes[0], getByIdsRes[1]);
    },
  ]);
  specs.push([
    "VECTORIZE.deleteByIds(ids)",
    async () => {
      let deleteByIdsRes = await run((VECTORIZE) =>
        VECTORIZE.deleteByIds(["", "999"]),
      );
      deepStrictEqual(deleteByIdsRes[0], deleteByIdsRes[1]);

      deleteByIdsRes = await run((VECTORIZE) => VECTORIZE.deleteByIds(["123"]));
      deepStrictEqual(deleteByIdsRes[0], deleteByIdsRes[1]);

      deleteByIdsRes = await run((VECTORIZE) =>
        VECTORIZE.deleteByIds(["456", "789"]),
      );
      deepStrictEqual(deleteByIdsRes[0], deleteByIdsRes[1]);
    },
  ]);

  return { beforeEach, specs };
};
