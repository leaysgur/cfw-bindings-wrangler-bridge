// @ts-check
import { isKVBinding, handleKVDispatch } from "./kv.js";
import { isServiceBinding, handleServiceDispatch } from "./service.js";
import { isR2Binding, handleR2Dispatch } from "./r2.js";

export default {
  /** @type {ExportedHandlerFetchHandler<Record<string, unknown>>} */
  async fetch(req, env) {
    // KV or R2 or ...
    const BINDING_MODULE = req.headers.get("X-BRIDGE-BINDING-MODULE");
    // MY_KV or MY_R2 or ...
    const BINDING_NAME = req.headers.get("X-BRIDGE-BINDING-NAME");
    if (!(BINDING_MODULE && BINDING_NAME))
      return new Response(
        "Wrong usage of bridge worker. Required headers are not presented.",
        { status: 400 }
      );

    const BINDING = env[BINDING_NAME];
    if (!BINDING)
      return new Response(
        `Failed to load env.${BINDING_NAME}. Check your wrangler.toml and reload.`,
        { status: 400 }
      );

    // Let's handle dispatch from bridge module!
    if (BINDING_MODULE === "KV" && isKVBinding(BINDING))
      return handleKVDispatch(BINDING, req).catch(
        (err) => new Response(err.message, { status: 500 })
      );

    if (BINDING_MODULE === "SERVICE" && isServiceBinding(BINDING))
      return handleServiceDispatch(BINDING, req).catch(
        (err) => new Response(err.message, { status: 500 })
      );

    if (BINDING_MODULE === "R2" && isR2Binding(BINDING))
      return handleR2Dispatch(BINDING, req).catch(
        (err) => new Response(err.message, { status: 500 })
      );

    return new Response(
      `Not supported binding: ${BINDING_MODULE} or ${BINDING_NAME} is not compatible for ${BINDING_MODULE} binding.`,
      { status: 404 }
    );
  },
};
