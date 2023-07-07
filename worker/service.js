// @ts-check

/**
 * @param {any} binding
 * @returns {binding is Fetcher}
 */
export const isServiceBinding = (binding) =>
  // This is true in remote but `Object` in local :(
  // binding.constructor.name === "Fetcher"
  typeof binding.fetch === "function";

/**
 * @param {Fetcher} SERVICE
 * @param {Request} req
 */
export const handleServiceDispatch = async (SERVICE, req) => {
  const { operation, parameters } = JSON.parse(
    req.headers.get("X-BRIDGE-SERVICE-REQUEST") ?? "{}"
  );

  if (operation === "fetch") {
    const [originalUrl] = parameters;

    // Route to original service(worker)
    const originalReq = new Request(originalUrl, req);

    // Clean up our header
    originalReq.headers.delete("X-BRIDGE-BINDING-MODULE");
    originalReq.headers.delete("X-BRIDGE-BINDING-NAME");
    originalReq.headers.delete("X-BRIDGE-SERVICE-REQUEST");

    return SERVICE.fetch(originalReq);
  }

  throw new Error(`SERVICE.${operation}() is not supported.`);
};
