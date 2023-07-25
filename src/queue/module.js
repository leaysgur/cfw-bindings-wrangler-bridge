// @ts-check

// Refs:
// https://developers.cloudflare.com/queues/platform/javascript-apis/
// https://github.com/cloudflare/workerd/blob/main/src/workerd/api/queue.c%2B%2B
// https://github.com/cloudflare/miniflare/blob/tre/packages/miniflare/src/plugins/queues/gateway.ts#L92

import { stringify } from "devalue";

export class WorkerQueue$ {
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
   * @param {string} operation
   * @param {unknown[]} parameters
   */
  async #dispatch(operation, parameters) {
    const res = await fetch(this.#bridgeWranglerOrigin, {
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
   * @param {QueueSendOptions} [options]
   */
  async send(body, options) {
    await this.#dispatch("Queue.send", [body, options]);
  }

  /** @param {Iterable<MessageSendRequest>} messages */
  async sendBatch(messages) {
    await this.#dispatch("Queue.sendBatch", [messages]);
  }
}
