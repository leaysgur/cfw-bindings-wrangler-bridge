// @ts-check
import { deepStrictEqual } from "node:assert";
import {
  createRunner,
  // equalRejectedResult,
  // sleepAfterRejectedResult,
} from "../test-utils.js";

/** @param {[VectorizeIndex, VectorizeIndex]} bindings */
export const createSpecs = ([ACTUAL, EXPECT]) => {
  const beforeEach = async () => {};

  /** @type {[name: string, spec: () => Promise<void>][]} */
  const specs = [];
  const run = createRunner([ACTUAL, EXPECT]);

  specs.push(["VECTORIZE.insert(vectors)", async () => {}]);
  specs.push(["VECTORIZE.upsert(vectors)", async () => {}]);
  specs.push(["VECTORIZE.query(vector)", async () => {}]);
  specs.push(["VECTORIZE.query(vector, options)", async () => {}]);
  specs.push(["VECTORIZE.getByIds(ids)", async () => {}]);
  specs.push(["VECTORIZE.deleteByIds(ids)", async () => {}]);
  specs.push([
    "VECTORIZE.describe()",
    async () => {
      let describeRes = await run((VECTORIZE) => VECTORIZE.describe());
      deepStrictEqual(describeRes[0], describeRes[1]);
    },
  ]);

  // specs.push([
  //   "QUEUE.sendBatch(messages)",
  //   async () => {
  //     let batchRes = await run((QUEUE) => QUEUE.sendBatch([{ body: "Yo" }]));
  //     deepStrictEqual(batchRes[0], batchRes[1]);
  //
  //     batchRes = await run((QUEUE) =>
  //       QUEUE.sendBatch([{ body: "🐔" }, { body: "🥚" }]),
  //     );
  //     deepStrictEqual(batchRes[0], batchRes[1]);
  //
  //     batchRes = await run((QUEUE) => QUEUE.sendBatch([]));
  //     equalRejectedResult(batchRes[0], batchRes[1]);
  //     await sleepAfterRejectedResult();
  //
  //     batchRes = await run((QUEUE) =>
  //       // Can be any `Iterable`
  //       QUEUE.sendBatch(new Set([{ body: [1, 2, 3] }, { body: 4 }])),
  //     );
  //     deepStrictEqual(batchRes[0], batchRes[1]);
  //   },
  // ]);

  return { beforeEach, specs };
};
