// @ts-check
import { parse } from "devalue";
import { hexStringToArrayBuffer } from "./shared.js";

/**
 * @param {any} binding
 * @returns {binding is R2Bucket}
 */
export const isR2Binding = (binding) => binding.constructor.name === "R2Bucket";

/**
 * @param {R2Bucket} R2
 * @param {Request} req
 */
export const handleR2Dispatch = async (R2, req) => {
  const { operation, parameters } = parse(
    req.headers.get("X-BRIDGE-R2-Dispatch") ?? "{}",
    {
      // Date: Handled by default
      Headers: (v) => new Headers(v),
      ArrayBuffer: (v) => hexStringToArrayBuffer(v),
    },
  );

  if (operation === "list") {
    const [options] = parameters;

    const result = await R2.list(options);

    return Response.json(result);
  }

  if (operation === "put") {
    const [key, , options] = parameters;
    const value = req.body;

    // Need to await here, otherwise already sent error
    const result = await R2.put(key, value, options);

    return Response.json(result);
  }

  if (operation === "get") {
    const [key, options] = parameters;

    const result = await R2.get(key, options);

    // `null`: key does not exists
    if (result === null) return Response.json(null);

    // `R2ObjectBody`: key exists and precondition is met
    if ("body" in result && result.constructor.name === "GetResult")
      return new Response(result.body, {
        headers: { "X-BRIDGE-R2-R2ObjectJSON": JSON.stringify(result) },
      });

    // `R2Object`: key exists but precondition is not met
    return Response.json(result);
  }

  if (operation === "head") {
    const [key] = parameters;

    const result = await R2.head(key);

    // `null`: key does not exists
    if (result === null) return Response.json(null);

    // `R2Object`: key exists
    return Response.json(result);
  }

  if (operation === "delete") {
    const [keys] = parameters;

    await R2.delete(keys);

    return new Response();
  }

  throw new Error(`R2.${operation}() is not supported.`);
};
