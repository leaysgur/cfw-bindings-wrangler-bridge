// @ts-check

/**
 * @param {any} binding
 * @returns {binding is KVNamespace}
 */
export const isKVBinding = (binding) =>
  binding.constructor.name === "KvNamespace";

/**
 * @param {KVNamespace} KV
 * @param {Request} req
 */
export const handleKVDispatch = async (KV, req) => {
  const { operation, parameters } = JSON.parse(
    req.headers.get("X-BRIDGE-KV-Dispatch") ?? "{}"
  );

  if (operation === "list") {
    const [options] = parameters;

    const result = await KV.list(options);

    return Response.json(result);
  }

  if (operation === "put") {
    const [key, , options] = parameters;
    // XXX: For TS...
    const value = req.body ?? "";

    // Need to await here, otherwise already sent error
    await KV.put(key, value, options);

    return new Response();
  }

  if (operation === "getWithMetadata") {
    const [key, typeOrOptions] = parameters;

    const { value, metadata } = await KV.getWithMetadata(key, {
      ...typeOrOptions,
      // Override it to respond over our bridge.
      // `stream` is fastest and type conversion is done by bridge module.
      type: "stream",
    });

    return new Response(value, {
      headers: { 
        "X-BRIDGE-KV-ValueIsNull": `${value === null}`,
        "X-BRIDGE-KV-Metadata": JSON.stringify(metadata),
      },
    });
  }

  if (operation === "delete") {
    const [key] = parameters;

    await KV.delete(key);

    return new Response();
  }

  throw new Error(`KV.${operation}() is not supported.`);
};
