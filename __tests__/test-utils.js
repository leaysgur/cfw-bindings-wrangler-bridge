// @ts-check
import { deepStrictEqual } from "node:assert";

/**
 * @template Binding
 * @param {[Binding, Binding]} bindings
 */
export const createRunner =
  ([ACTUAL, EXPECT]) =>
  /**
   * @template Result
   * @param {(b: Binding) => Promise<Result> | Result} spec
   * @returns {Promise<PromiseSettledResult<Result>[]>}
   */
  async (spec) => {
    console.log("Run:", spec.toString());
    return Promise.allSettled([spec(ACTUAL), spec(EXPECT)]);
  };

/**
 * @param {PromiseSettledResult<unknown>} actual
 * @param {PromiseSettledResult<unknown>} expect
 */
export const equalRejectedResult = (actual, expect) => {
  if (actual.status === "rejected" && expect.status === "rejected")
    return deepStrictEqual(actual.reason.message, expect.reason.message);

  deepStrictEqual(actual, expect);
};

// XXX: Don't know why but sleep is required just after rejected spec.
// Otherwise, continuous spec fails with `Network connection lost.` error...
export const sleepAfterRejectedResult = () =>
  new Promise((r) => setTimeout(r, 100));
