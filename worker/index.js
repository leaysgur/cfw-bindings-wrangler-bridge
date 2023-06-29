import { kvHandle } from "./kv.js";
import { r2Handle } from "./r2.js";
import { serviceHandle } from "./service.js";

export default {
  /** @type {import("@cloudflare/workers-types").ExportedHandlerFetchHandler} */
  async fetch(req, env) {
    const url = new URL(req.url);
    const [, OPERATION, BINDING] = url.pathname.split("/");

    if (BINDING in env === false)
      return Response.json(
        { error: "Binding not found. Check your `wrangler.toml`." },
        { status: 400 }
      );

    // KV ---
    if (
      OPERATION.startsWith("kv_") &&
      env[BINDING].constructor.name === "KvNamespace"
    )
      return kvHandle(env[BINDING], OPERATION, req).catch((err) =>
        Response.json(
          { error: `Failed in kvHandle(): ${err.message}` },
          { status: 500 }
        )
      );

    // Service ---
    if (
      OPERATION.startsWith("service_") &&
      // This is `Object` in local :(
      // env[BINDING].constructor.name === "Fetcher"
      typeof env[BINDING].fetch === "function"
    )
      return serviceHandle(env[BINDING], OPERATION, req).catch((err) =>
        Response.json(
          { error: `Failed in serviceHandle(): ${err.message}` },
          { status: 500 }
        )
      );

    // R2 ---
    if (OPERATION.startsWith("r2_") && typeof env[BINDING].get === "function")
      return r2Handle(env[BINDING], OPERATION, req).catch((err) =>
        Response.json(
          { error: `Failed in r2Handle(): ${err.message}` },
          { status: 500 }
        )
      );

    return Response.json(
      { error: `Not supported operation: ${OPERATION}.` },
      { status: 404 }
    );
  },
};
