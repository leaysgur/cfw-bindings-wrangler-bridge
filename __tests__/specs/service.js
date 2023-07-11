// @ts-check
import { deepStrictEqual } from "node:assert";

/**
 * @param {Fetcher} ACTUAL
 * @param {Fetcher} EXPECT
 * @returns {[name: string, spec: () => Promise<void>][]}
 */
export const createSpecs = (ACTUAL, EXPECT) => {
  return [
    [
      "SERVICE.fetch() -> v",
      async () => {
        const [actual, expect] = await Promise.allSettled([
          ACTUAL.fetch("https://example.com").then((r) => r.text()),
          EXPECT.fetch("https://example.com").then((r) => r.text()),
        ]);

        deepStrictEqual(actual, expect);
      },
    ],
  ];
};
