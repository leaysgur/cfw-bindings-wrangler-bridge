// @ts-check

/**
 * @param {import("@cloudflare/workers-types").R2Bucket} R2
 * @param {string} OPERATION
 * @param {import("@cloudflare/workers-types").Request} req
 */
export const r2Handle = async (R2, OPERATION, req) => {
  const url = new URL(req.url);
  const [, , , encodedKey] = url.pathname.split("/");
  const key = decodeURIComponent(encodedKey);
  const options = JSON.parse(req.headers.get("CF-R2-OPTIONS") ?? "{}");

  if (OPERATION === "r2_head") {
    const result = await R2.head(key);
    return Response.json(result);
  }

  if (OPERATION === "r2_get") {
    const result = await R2.get(key, options);
    console.log({ result });
    if (result == null)
      return Response.json({ error: "Not found" }, { status: 404 });

    const resultObject =
      /** @type {import("@cloudflare/workers-types").R2Object} */ (
        Object.keys(result).reduce((obj, key) => {
          // @ts-ignore
          obj[key] = result[key];
          return obj;
        }, {})
      );

    return new Response("body" in result ? result.body : null, {
      headers: {
        "CF-R2-Object": JSON.stringify({ resultObject }),
      },
    });
  }

  if (OPERATION === "r2_put") {
    const value = req.body;

    // Need to await here, otherwise already sent error
    const result = await R2.put(key, value, options);

    return Response.json(result);
  }

  if (OPERATION === "r2_list") {
    const result = await R2.list(options);

    return Response.json(result);
  }

  if (OPERATION === "r2_delete") {
    await R2.delete(key);

    return Response.json(null);
  }

  return Response.json(
    { error: `Unknown operation: ${OPERATION}.` },
    { status: 404 }
  );
};
