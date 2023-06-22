import { kvHandle } from "./kv.js";

export default {
  /** @type {import("@cloudflare/workers-types").ExportedHandlerFetchHandler} */
  async fetch(req, env) {
    const url = new URL(req.url);
    const [, OPERATION, BINDING] = url.pathname.split("/");

    if (BINDING in env === false)
      return Response.json(
        { error: "Binding not found. Check your `wrangler.toml`." },
        { status: 404 }
      );

    if (OPERATION.startsWith("kv_"))
      return kvHandle(env[BINDING], OPERATION, req);

    return Response.json(
      { error: `Unknown operation: ${OPERATION}.` },
      { status: 404 }
    );
  },
};
