// @ts-check

/** @param {any} binding */
export const isKVBinding = (binding) =>
  binding.constructor.name === "KvNamespace";

/**
 * @param {import("@cloudflare/workers-types").KVNamespace} KV
 * @param {string} OPERATION
 * @param {import("@cloudflare/workers-types").Request} req
 */
export const kvHandle = async (KV, OPERATION, req) => {
  const url = new URL(req.url);
  // pathname is like `/kv_get/BINDING/encodeURIComponent(key)`
  const [, , , encodedKey] = url.pathname.split("/");
  const key = decodeURIComponent(encodedKey);
  const options = Object.fromEntries(url.searchParams.entries());

  // Handle `get()` + `getWithMetadata()`
  // `metadata` will be ignored for `get()`
  if (OPERATION === "kv_get") {
    const { value, metadata } = await KV.getWithMetadata(key, {
      ...options,
      // This is fastest, type handling will be done by bridge side
      type: "stream",
    });

    return new Response(value, {
      headers: { "CF-KV-Metadata": JSON.stringify(metadata) },
    });
  }

  if (OPERATION === "kv_put") {
    // May not be `null` but for TS
    const value = req.body ?? "";

    const metadata = req.headers.get("CF-KV-Metadata");
    if (metadata) options.metadata = JSON.parse(metadata);

    // Need to await here, otherwise already sent error
    await KV.put(key, value, options);

    return Response.json(null);
  }

  if (OPERATION === "kv_list") {
    const result = await KV.list(options);

    return Response.json(result);
  }

  if (OPERATION === "kv_delete") {
    await KV.delete(key);

    return Response.json(null);
  }

  return Response.json(
    { error: `Unknown operation: ${OPERATION}.` },
    { status: 404 }
  );
};
