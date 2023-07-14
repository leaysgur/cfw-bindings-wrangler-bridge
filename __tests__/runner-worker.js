// @ts-check
import { AssertionError } from "node:assert";
import { createBridge } from "../module.js";
import { createSpecs as createKVSpecs } from "./specs/kv.js";
import { createSpecs as specsSERVICESpecs } from "./specs/service.js";
import { createSpecs as createR2Specs } from "./specs/r2.js";

/**
 * @typedef {{
 *   ACTUAL_KV: KVNamespace;
 *   EXPECT_KV: KVNamespace;
 *   ACTUAL_SERVICE: Fetcher;
 *   EXPECT_SERVICE: Fetcher;
 *   ACTUAL_R2: R2Bucket;
 *   EXPECT_R2: R2Bucket;
 * }} Env
 */

/**
 * @param {URLSearchParams} searchParams
 * @param {Env} env
 * @param {WritableStreamDefaultWriter} writer
 * */
const runSpecs = async (searchParams, env, writer) => {
  const targets = searchParams.getAll("t");

  const encoder = new TextEncoder();
  /** @param {string} line */
  const write = (line) => writer.write(encoder.encode(line + "\n"));
  /** @param {string} line */
  const finish = (line) => {
    write(line);
    writer.close();
  };

  /**
   * @type {Map<string, {
   *   beforeEach: () => Promise<void>;
   *   specs: [name: string, spec: () => Promise<void>][]
   * }>}
   */
  const suites = new Map();
  const bridge = createBridge();

  if (targets.includes("kv")) {
    const ACTUAL = /** @type {KVNamespace} */ (
      /** @type {unknown} */ (bridge.KV("ACTUAL_KV"))
    );
    const EXPECT = env.EXPECT_KV;
    suites.set("KV", createKVSpecs([ACTUAL, EXPECT]));
  }

  if (targets.includes("service")) {
    const ACTUAL = /** @type {Fetcher} */ (
      /** @type {unknown} */ (bridge.SERVICE("ACTUAL_SERVICE"))
    );
    const EXPECT = env.EXPECT_SERVICE;
    suites.set("SERVICE", specsSERVICESpecs([ACTUAL, EXPECT]));
  }

  if (targets.includes("r2")) {
    const ACTUAL = /** @type {R2Bucket} */ (
      /** @type {unknown} */ (bridge.R2("ACTUAL_R2"))
    );
    const EXPECT = env.EXPECT_R2;
    suites.set("R2", createR2Specs([ACTUAL, EXPECT]));
  }

  if (suites.size === 0) {
    return finish(
      "No suites to run. Add params like `?t=kv` or `?t=r2&t=service` to the URL to run specs.",
    );
  }

  for (const [key, { beforeEach, specs }] of suites) {
    write(`👾 Running "${key}" specs`);
    write("----------------------");

    // Order is important.
    for (const [name, spec] of specs) {
      console.log("Spec:", name);
      try {
        await beforeEach();
        await spec();
        write(`✅ ${name}`);
      } catch (_err) {
        const err = /** @type {Error} */ (_err);

        console.error("💥", `Failed spec: ${name}`);
        console.error(err);
        if (err instanceof AssertionError) {
          console.error("actual", JSON.stringify(err.actual, null, 2));
          console.error("expect", JSON.stringify(err.expected, null, 2));
        }

        write(`💥 ${name}`);
        write(err.message);
        write("");
        // bail
        finish("Some specs are failed 😭");
        break;
      }

      console.log("");
    }

    write("----------------------");
    write("");
  }

  finish("All specs are passed ✨");
};

export default {
  /** @type {ExportedHandlerFetchHandler<Env>} */
  async fetch(req, env, ctx) {
    const { searchParams } = new URL(req.url);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    ctx.waitUntil(runSpecs(searchParams, env, writer));

    return new Response(readable);
  },
};
