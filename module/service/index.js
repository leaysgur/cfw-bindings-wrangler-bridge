// @ts-check

// Refs:
// https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B

import { resolveModuleOptions } from "../options.js";
/** @typedef {import("../index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

export class Fetcher$ {
  #bindingName;
  #bridgeWorkerOrigin;

  /**
   * @param {string} bindingName
   * @param {BridgeModuleOptions} [options]
   */
  constructor(bindingName, options) {
    this.#bindingName = bindingName;

    const { bridgeWorkerOrigin } = resolveModuleOptions(options);
    this.#bridgeWorkerOrigin = bridgeWorkerOrigin;
  }

  /**
   * @param {RequestInfo} requestOrUrl
   * @param {RequestInit} [requestInit]
   */
  async fetch(requestOrUrl, requestInit) {
    const originalReq = new Request(requestOrUrl, requestInit);

    // Route to bridge(worker) w/ stashed original url
    const req = new Request(this.#bridgeWorkerOrigin, originalReq);
    req.headers.set("X-BRIDGE-BINDING-MODULE", "SERVICE");
    req.headers.set("X-BRIDGE-BINDING-NAME", this.#bindingName);
    req.headers.set(
      "X-BRIDGE-SERVICE-Dispatch",
      JSON.stringify({
        operation: "Fetcher.fetch",
        parameters: [originalReq.url],
      }),
    );

    return fetch(req);
  }
}
