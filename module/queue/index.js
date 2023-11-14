// @ts-check

// Refs:
// https://developers.cloudflare.com/queues/platform/javascript-apis/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/queue.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/tre/packages/miniflare/src/plugins/queues/gateway.ts#L92

import { stringify } from "devalue";
import { resolveModuleOptions } from "../options.js";
/** @typedef {import("../index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

export class WorkerQueue$ {
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
   * @param {string} operation
   * @param {unknown[]} parameters
   */
  async #dispatch(operation, parameters) {
    const res = await fetch(this.#bridgeWorkerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-BINDING-MODULE": "QUEUE",
        "X-BRIDGE-BINDING-NAME": this.#bindingName,
      },
      body: stringify({ operation, parameters }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return res;
  }

  /**
   * @param {unknown} body
   * @param {import("@cloudflare/workers-types/experimental").QueueSendOptions} [options]
   */
  async send(body, options) {
    await this.#dispatch("Queue.send", [body, options]);
  }

  /** @param {Iterable<import("@cloudflare/workers-types/experimental").MessageSendRequest>} messages */
  async sendBatch(messages) {
    await this.#dispatch("Queue.sendBatch", [messages]);
  }
}
