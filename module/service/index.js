// @ts-check

// Refs:
// https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B

export class Fetcher$ {
  #bridgeWranglerOrigin;
  #bindingName;
  #fetchImpl;

  /**
   * @param {string} origin
   * @param {string} bindingName
   * @param {typeof fetch} fetchImpl
   */
  constructor(origin, bindingName, fetchImpl) {
    this.#bridgeWranglerOrigin = origin;
    this.#bindingName = bindingName;
    this.#fetchImpl = fetchImpl;
  }

  /**
   * @param {RequestInfo} requestOrUrl
   * @param {RequestInit} [requestInit]
   */
  async fetch(requestOrUrl, requestInit) {
    const originalReq = new Request(requestOrUrl, requestInit);

    // Route to bridge(worker) w/ stashed original url
    const req = new Request(this.#bridgeWranglerOrigin, originalReq);
    req.headers.set("X-BRIDGE-BINDING-MODULE", "SERVICE");
    req.headers.set("X-BRIDGE-BINDING-NAME", this.#bindingName);
    req.headers.set(
      "X-BRIDGE-SERVICE-Dispatch",
      JSON.stringify({
        operation: "Fetcher.fetch",
        parameters: [originalReq.url],
      }),
    );

    return this.#fetchImpl(req);
  }
}

export class DirectFetcher$ {
  #serviceWranglerOrigin;
  #fetchImpl;

  /** 
   * @param {string} origin
   * @param {typeof fetch} fetchImpl
   */
  constructor(origin, fetchImpl) {
    this.#serviceWranglerOrigin = origin;
    this.#fetchImpl = fetchImpl;
  }

  /**
   * @param {RequestInfo} requestOrUrl
   * @param {RequestInit} [requestInit]
   */
  async fetch(requestOrUrl, requestInit) {
    const originalReq = new Request(requestOrUrl, requestInit);

    // Replace `origin` part for routing, others are kept as-is.
    //
    // This is crucial as bridge implementation but may be problematic,
    // if user's service(worker) depends on incoming `origin` string.
    const url = new URL(originalReq.url);
    const serviceWranglerUrl = new URL(this.#serviceWranglerOrigin);
    url.protocol = serviceWranglerUrl.protocol;
    url.host = serviceWranglerUrl.host;

    // Direct `fetch()` to user's service(worker)
    return this.#fetchImpl(url, originalReq);
  }
}
