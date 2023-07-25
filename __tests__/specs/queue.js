// @ts-check
import { deepStrictEqual } from "node:assert";
import {
  createRunner,
  equalRejectedResult,
  sleepAfterRejectedResult,
} from "../test-utils.js";

/** @param {[Queue<unknown>, Queue<unknown>]} bindings */
export const createSpecs = ([ACTUAL, EXPECT]) => {
  const beforeEach = async () => {};

  /** @type {[name: string, spec: () => Promise<void>][]} */
  const specs = [];
  const run = createRunner([ACTUAL, EXPECT]);

  specs.push([
    "QUEUE.send(body)",
    async () => {
      let sendRes = await run((QUEUE) => QUEUE.send("Hey"));
      deepStrictEqual(sendRes[0], sendRes[1]);

      sendRes = await run((QUEUE) => QUEUE.send(null));
      deepStrictEqual(sendRes[0], sendRes[1]);

      sendRes = await run((QUEUE) => QUEUE.send({ a: 42 }));
      deepStrictEqual(sendRes[0], sendRes[1]);
    },
  ]);
  specs.push([
    "QUEUE.send(body, options)",
    async () => {
      let sendRes = await run((QUEUE) =>
        QUEUE.send("Hey", { contentType: "text" }),
      );
      deepStrictEqual(sendRes[0], sendRes[1]);
      sendRes = await run((QUEUE) => QUEUE.send("Hello", {}));
      deepStrictEqual(sendRes[0], sendRes[1]);

      sendRes = await run((QUEUE) =>
        QUEUE.send('[{ "this": "is" }, "json"]', { contentType: "json" }),
      );
      deepStrictEqual(sendRes[0], sendRes[1]);
    },
  ]);

  specs.push([
    "QUEUE.sendBatch(messages)",
    async () => {
      let batchRes = await run((QUEUE) => QUEUE.sendBatch([{ body: "Yo" }]));
      deepStrictEqual(batchRes[0], batchRes[1]);

      batchRes = await run((QUEUE) =>
        QUEUE.sendBatch([{ body: "🐔" }, { body: "🥚" }]),
      );
      deepStrictEqual(batchRes[0], batchRes[1]);

      batchRes = await run((QUEUE) => QUEUE.sendBatch([]));
      equalRejectedResult(batchRes[0], batchRes[1]);
      await sleepAfterRejectedResult();

      batchRes = await run((QUEUE) =>
        // Can be any `Iterable`
        QUEUE.sendBatch(new Set([{ body: [1, 2, 3] }, { body: 4 }])),
      );
      deepStrictEqual(batchRes[0], batchRes[1]);
    },
  ]);

  return { beforeEach, specs };
};
