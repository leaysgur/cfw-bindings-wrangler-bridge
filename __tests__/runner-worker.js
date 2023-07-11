// @ts-check
import { createBridge } from "../module.js";
import { before as beforeKV, createSpecs as specsKV } from "./specs/kv.js";
import { createSpecs as specsSERVICE } from "./specs/service.js";
import { before as beforeR2, createSpecs as specsR2 } from "./specs/r2.js";

export default {
  /**
   * @type {ExportedHandlerFetchHandler<{
   *   TEST_KV: KVNamespace;
   *   TEST_R2: R2Bucket;
   *   TEST_SERVICE: Fetcher;
   * }>}
   */
  async fetch(req, env) {
    const { searchParams } = new URL(req.url);
    const bridge = createBridge();

    /**
     * @type {Map<string, [name: string, spec: () => Promise<void>][]>}
     */
    const suites = new Map();

    if (searchParams.has("kv")) {
      const ACTUAL = /** @type {KVNamespace} */ (
        /** @type {unknown} */ (bridge.KV("TEST_KV"))
      );
      const EXPECT = env.TEST_KV;

      await beforeKV(ACTUAL, EXPECT);
      suites.set("KV", specsKV(ACTUAL, EXPECT));
    }

    if (searchParams.has("service")) {
      const ACTUAL = /** @type {Fetcher} */ (
        /** @type {unknown} */ (bridge.SERVICE("TEST_SERVICE"))
      );
      const EXPECT = env.TEST_SERVICE;

      suites.set("SERVICE", specsSERVICE(ACTUAL, EXPECT));
    }

    if (searchParams.has("r2")) {
      const ACTUAL = /** @type {R2Bucket} */ (
        /** @type {unknown} */ (bridge.R2("TEST_R2"))
      );
      const EXPECT = env.TEST_R2;

      await beforeR2(ACTUAL, EXPECT);
      suites.set("R2", specsR2(ACTUAL, EXPECT));
    }

    if (suites.size === 0)
      return new Response(
        "No specs to run. Add params like `?kv` or `?r2&service` to the URL to run specs."
      );

    const results = [];
    for (const [key, suite] of suites) {
      results.push(`## ${key}`);

      // Order is important.
      for (const [name, test] of suite) {
        try {
          await test();
          results.push(`✅ ${name}`);
        } catch (err) {
          results.push(`💥 ${name}`);
          // @ts-expect-error: `err` is `unknown`
          results.push(err.message);

          console.error(name, err);
          console.error(JSON.stringify(err, null, 2));
        }
      }

      results.push("");
    }

    return new Response(results.join("\n"));
  },
};
