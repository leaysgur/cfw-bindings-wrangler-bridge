// @ts-check

// Refs:
// https://developers.cloudflare.com/d1/platform/client-api/
// https://github.com/cloudflare/workerd/blob/main/src/cloudflare/internal/d1-api.ts

import { stringify } from "devalue";
import { D1PreparedStatement$ } from "./d1-prepared-statement.js";
import { resolveModuleOptions } from "../options.js";
/** @typedef {import("../index.d.ts").BridgeModuleOptions} BridgeModuleOptions */

export class D1Database$ {
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

  /** @type {import("./types.ts").Dispatch} */
  async #dispatch(operation, parameters) {
    const res = await fetch(this.#bridgeWorkerOrigin, {
      method: "POST",
      headers: {
        "X-BRIDGE-BINDING-MODULE": "D1",
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

  /** @param {string} query */
  prepare(query) {
    return new D1PreparedStatement$(query, [], this.#dispatch.bind(this));
  }

  async dump() {
    const res = await this.#dispatch("D1Database.dump", []);
    const arrayBuffer = await res.arrayBuffer();

    return arrayBuffer;
  }

  /** @param {import("@cloudflare/workers-types/experimental").D1PreparedStatement[]} statements */
  async batch(statements) {
    const res = await this.#dispatch("D1Database.batch", [
      statements.map((stmt) => {
        const stmt$ = /** @type {D1PreparedStatement$} */ (stmt);
        return [stmt$.statement, stmt$.params];
      }),
    ]);
    const json = await res.json();

    return json;
  }

  /** @param {string} query */
  async exec(query) {
    const res = await this.#dispatch("D1Database.exec", [query]);
    const json = await res.json();

    return json;
  }
}
