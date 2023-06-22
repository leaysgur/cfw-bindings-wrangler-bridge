// @ts-check
/**
 * @param {import("@cloudflare/workers-types").KVNamespace} KV
 * @param {string} OPERATION
 * @param {Request} req
 */
export const kvHandle = async (KV, OPERATION, req) => {
  const url = new URL(req.url);
  const [, , , key] = url.pathname.split("/");
  const options = Object.fromEntries(url.searchParams.entries());

  switch (OPERATION) {
    case "kv_list": {
      const result = await KV.list(options);
      return Response.json(result);
    }
    case "kv_put": {
      const value = req.body ?? "";

      const metadata = req.headers.get("CF-KV-Metadata");
      if (metadata) options.metadata = JSON.parse(metadata);

      // Need to await here, otherwise response already sent error
      await KV.put(key, value, options);
      return Response.json(null);
    }
    case "kv_get": {
      const { value, metadata } = await KV.getWithMetadata(key, options);
      return new Response(value, {
        headers: { "CF-KV-Metadata": JSON.stringify(metadata) },
      });
    }
    case "kv_delete": {
      await KV.delete(key);
      return Response.json(null);
    }
  }

  return Response.json(
    { error: `Unknown operation: ${OPERATION}.` },
    { status: 404 }
  );
};
