import { isKVBinding, kvHandle } from "./kv.js";
import { isServiceBinding, serviceHandle } from "./service.js";
import { isR2Binding, r2Handle } from "./r2.js";

export default {
  /** @type {import("@cloudflare/workers-types").ExportedHandlerFetchHandler} */
  async fetch(req, env) {
    if (req.method !== "POST")
      return new Response(
        "Wrong usage of bridge worker. It should be called via bridge module.",
        { status: 400 }
      );

    const bridgeRequestHeader = req.headers.get("X-BRIDGE-REQUEST");
    if (!bridgeRequestHeader)
      return new Response(
        "Wrong usage of bridge worker. Required header is not presented.",
        { status: 400 }
      );

    /**
     * @type {{
     *   binding: string;
     *   operation: string;
     *   parameters: any[];
     * }} bridgeRequest
     */
    const {
      binding: BINDING,
      operation: OPERATION,
      parameters,
    } = JSON.parse(bridgeRequestHeader);
    const body = req.body;

    if (BINDING in env === false)
      return new Response(
        `Binding: ${BINDING} is not loaded. Check your wrangler.toml and reload.`,
        { status: 400 }
      );

    if (OPERATION.startsWith("KV.") && isKVBinding(env[BINDING]))
      return kvHandle(env[BINDING], OPERATION, parameters, req.body).catch(
        (err) => new Response(err.message, { status: 500 })
      );

    if (OPERATION.startsWith("SERVICE.") && isServiceBinding(env[BINDING]))
      return serviceHandle(env[BINDING], OPERATION, parameters, req.body).catch(
        (err) => new Response(err.message, { status: 500 })
      );

    if (OPERATION.startsWith("R2.") && isR2Binding(env[BINDING]))
      return r2Handle(env[BINDING], OPERATION, parameters, req.body).catch(
        (err) => new Response(err.message, { status: 500 })
      );

    return new Response(
      `Not supported operation: ${OPERATION}. Or your binding: ${BINDING} is not compatible.`,
      { status: 404 }
    );
  },
};
