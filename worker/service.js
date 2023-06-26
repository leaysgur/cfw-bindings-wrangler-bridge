// @ts-check

/**
 * @param {import("@cloudflare/workers-types").Fetcher} SERVICE
 * @param {string} OPERATION
 * @param {import("@cloudflare/workers-types").Request} req
 */
export const serviceHandle = async (SERVICE, OPERATION, req) => {
  if (OPERATION === "service_fetch") {
    const originalUrl =
      req.headers.get("X-ServiceFetch-Original-Url") ?? req.url;

    // Clean up our header
    const originalReq = new Request(originalUrl, req);
    originalReq.headers.delete("X-ServiceFetch-Original-Url");

    return SERVICE.fetch(originalReq);
  }

  return Response.json(
    { error: `Unknown operation: ${OPERATION}.` },
    { status: 404 }
  );
};
