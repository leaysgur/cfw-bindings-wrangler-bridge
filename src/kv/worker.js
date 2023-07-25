// @ts-check
import { stringify, parse } from "devalue";

/** @param {string} key */
const decodeKey = (key) => decodeURIComponent(key);

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
  const { operation, parameters } = parse(
    req.headers.get("X-BRIDGE-KV-Dispatch") ?? "{}",
  );

  if (operation === "KVNamespace.list") {
    const [options] = parameters;

    const result = await KV.list(options);

    return Response.json(result);
  }

  if (operation === "KVNamespace.put") {
    const [encodedKey, options] = parameters;
    const key = decodeKey(encodedKey);
    const value = req.body ?? "Only for TS, never happens";

    // Need to await here, otherwise already sent error
    await KV.put(key, value, options);

    return new Response();
  }

  if (operation === "KVNamespace.getWithMetadata") {
    const [encodedKey, typeOrOptions] = parameters;
    const key = decodeKey(encodedKey);

    const { value, metadata, cacheStatus } = await KV.getWithMetadata(key, {
      ...(typeof typeOrOptions !== "string" ? typeOrOptions : {}),
      // Override it to respond over our bridge.
      // `stream` is fastest and type conversion is done by bridge module.
      type: "stream",
    });

    return new Response(value, {
      headers: {
        "X-BRIDGE-KV-ValueIsNull": `${value === null}`,
        "X-BRIDGE-KV-Metadata": stringify(metadata),
        "X-BRIDGE-KV-CacheStatus": stringify(cacheStatus),
      },
    });
  }

  if (operation === "KVNamespace.delete") {
    const [encodedKey] = parameters;
    const key = decodeKey(encodedKey);

    await KV.delete(key);

    return new Response();
  }

  throw new Error(`${operation}() is not supported.`);
};
