// @ts-check

// Refs:
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B

// Fetcher
export class ServiceBridge {
  #bridgeWranglerOrigin;
  #bindingName;

  /**
   * @param {string} origin
   * @param {string} bindingName
   */
  constructor(origin, bindingName) {
    this.#bridgeWranglerOrigin = origin;
    this.#bindingName = bindingName;
  }

  /**
   * @param {import("@cloudflare/workers-types").RequestInfo} requestOrUrl
   * @param {import("@cloudflare/workers-types").RequestInit} [requestInit]
   */
  async fetch(requestOrUrl, requestInit) {
    const url = new URL(this.#bridgeWranglerOrigin);
    url.pathname = `/service_fetch/${this.#bindingName}`;

    const originalReq = new Request(requestOrUrl, requestInit);

    // Route to bridge(worker) w/ original url
    const req = new Request(url, originalReq);
    req.headers.set("X-ServiceFetch-Original-Url", originalReq.url);

    return fetch(req);
  }
}

// Fetcher
export class ServiceBridgeDirect {
  #serviceWranglerOrigin;

  /** @param {string} origin */
  constructor(origin) {
    this.#serviceWranglerOrigin = origin;
  }

  /**
   * @param {import("@cloudflare/workers-types").RequestInfo} requestOrUrl
   * @param {import("@cloudflare/workers-types").RequestInit} [requestInit]
   */
  async fetch(requestOrUrl, requestInit) {
    const serviceWranglerUrl = new URL(this.#serviceWranglerOrigin);
    const originalReq = new Request(requestOrUrl, requestInit);

    // Replace `origin` part for routing, others are kept as-is
    // This may be problematic if service(worker) depends on incoming `origin` string
    const url = new URL(originalReq.url);
    url.protocol = serviceWranglerUrl.protocol;
    url.host = serviceWranglerUrl.host;

    // Direct `fetch()` to service's `wrangler dev` process
    return fetch(new Request(url, originalReq));
  }
}
