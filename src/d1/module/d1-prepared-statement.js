// @ts-check

// Refs:
// https://developers.cloudflare.com/d1/platform/client-api/#query-statement-methods

/** @typedef {import("./types.d.ts").Dispatch} Dispatch */

// implements D1PreparedStatement
export class D1PreparedStatement$ {
  #statement;
  #params;
  #dispatch;

  /**
   * @param {string} statement
   * @param {unknown[]} values
   * @param {Dispatch} dispatch
   */
  constructor(statement, values, dispatch) {
    this.#statement = statement;
    this.#params = values;
    this.#dispatch = dispatch;
  }

  /** @param {unknown[]} values */
  bind(...values) {
    return new D1PreparedStatement$(
      this.#statement,
      values.map((v) => {
        // Our only concern here is to transform values into JSON serializable.
        // There may be invalid values inside, but we don't care.
        if (v instanceof ArrayBuffer) return Array.from(new Uint8Array(v));
        // @ts-expect-error: `length` is missing?
        if (ArrayBuffer.isView(v)) return Array.from(v);

        return v;
      }),
      this.#dispatch,
    );
  }

  async first() {}
  async run() {}
  async all() {
    const res = await this.#dispatch("D1PreparedStatement.all", [this.#statement, this.#params]);
    const json = await res.json();

    return json;
  }
  async raw() {}
}
