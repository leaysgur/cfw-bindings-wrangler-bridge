// @ts-check

/** @param {any} binding */
export const isKVBinding = (binding) =>
  binding.constructor.name === "KvNamespace";

/**
 * @param {import("@cloudflare/workers-types").KVNamespace} KV
 * @param {string} OPERATION
 * @param {any[]} parameters
 * @param {import("@cloudflare/workers-types").Request["body"]} body
 */
export const kvHandle = async (KV, OPERATION, parameters, body) => {
  // Handle `get()` + `getWithMetadata()`
  // `metadata` will be ignored for `get()`
  if (OPERATION === "KV.getWithMetadata") {
    const [key, typeOrOptions] = parameters;

    const { value, metadata } = await KV.getWithMetadata(key, {
      ...typeOrOptions,
      // Override it to respond over our bridge.
      // `stream` is fastest and type conversion is done by bridge module.
      type: "stream",
    });

    return new Response(value, {
      headers: { "X-BRIDGE-RESPONSE": JSON.stringify({ metadata }) },
    });
  }

  if (OPERATION === "KV.put") {
    const [key, , options] = parameters;
    // XXX: For TS...
    const value = body ?? "";

    // Need to await here, otherwise already sent error
    await KV.put(key, value, options);

    return new Response(null);
  }

  if (OPERATION === "KV.list") {
    const [options] = parameters;

    const result = await KV.list(options);

    return Response.json(result);
  }

  if (OPERATION === "KV.delete") {
    const [key] = parameters;

    await KV.delete(key);

    return new Response(null);
  }

  return new Response(`Unknown operation: ${OPERATION}.`, { status: 404 });
};
