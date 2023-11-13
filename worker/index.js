// @ts-check
import { isKVBinding, handleKVDispatch } from "./kv/index.js";
import { isServiceBinding, handleServiceDispatch } from "./service/index.js";
import { isR2Binding, handleR2Dispatch } from "./r2/index.js";
import { isD1Binding, handleD1Dispatch } from "./d1/index.js";
import { isQueueBinding, handleQueueDispatch } from "./queue/index.js";
import {
  isVectorizeBinding,
  handleVectorizeDispatch,
} from "./vectorize/index.js";
import { getBindings } from "./_internals/index.js";

/** @type {ExportedHandlerFetchHandler<Record<string, any>>} */
const handleInternalsRequest = (req, env) => {
  const INTERNALS_METHOD = req.headers.get("X-BRIDGE-INTERNALS");

  if (INTERNALS_METHOD === "getBindings")
    return Response.json(getBindings(env));

  return Response.json(`Not supported internals method: ${INTERNALS_METHOD}.`, {
    status: 404,
  });
};

/** @type {ExportedHandlerFetchHandler<Record<string, any>>} */
const handleBridgeRequest = (req, env) => {
  // KV or R2 or ...
  const BINDING_MODULE = req.headers.get("X-BRIDGE-BINDING-MODULE");
  // MY_KV or MY_R2 or ...
  const BINDING_NAME = req.headers.get("X-BRIDGE-BINDING-NAME");
  if (!(BINDING_MODULE && BINDING_NAME))
    return new Response(
      "Wrong usage of bridge worker. Required headers are not presented.",
      { status: 400 },
    );

  const BINDING = env[BINDING_NAME];
  if (!BINDING)
    return new Response(
      `Failed to load env.${BINDING_NAME}. Check your wrangler.toml and reload.`,
      { status: 400 },
    );

  // Let's handle dispatch from bridge module!
  if (BINDING_MODULE === "KV" && isKVBinding(BINDING))
    return handleKVDispatch(BINDING, req).catch(
      (err) => new Response(err.message, { status: 500 }),
    );

  if (BINDING_MODULE === "SERVICE" && isServiceBinding(BINDING))
    return handleServiceDispatch(BINDING, req).catch(
      (err) => new Response(err.message, { status: 500 }),
    );

  if (BINDING_MODULE === "R2" && isR2Binding(BINDING))
    return handleR2Dispatch(BINDING, req).catch(
      (err) => new Response(err.message, { status: 500 }),
    );

  if (BINDING_MODULE === "D1" && isD1Binding(BINDING))
    return handleD1Dispatch(BINDING, req).catch(
      (err) => new Response(err.message, { status: 500 }),
    );

  if (BINDING_MODULE === "QUEUE" && isQueueBinding(BINDING))
    return handleQueueDispatch(BINDING, req).catch(
      (err) => new Response(err.message, { status: 500 }),
    );

  if (BINDING_MODULE === "VECTORIZE" && isVectorizeBinding(BINDING))
    return handleVectorizeDispatch(BINDING, req).catch(
      (err) => new Response(err.message, { status: 500 }),
    );

  return new Response(
    `Not supported binding: ${BINDING_MODULE} or ${BINDING_NAME} is not compatible for ${BINDING_MODULE} binding.`,
    { status: 404 },
  );
};

/** @type {ExportedHandler<Record<string, any>>} */
export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        },
      });

    let res;
    if (req.headers.has("X-BRIDGE-INTERNALS")) {
      res = await handleInternalsRequest(req, env, ctx);
    } else {
      res = await handleBridgeRequest(req, env, ctx);
    }

    res.headers.set("access-control-allow-origin", "*");
    return res;
  },
};
