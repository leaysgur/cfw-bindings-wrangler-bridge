// @ts-check

// Refs:
// https://developers.cloudflare.com/d1/platform/client-api/#query-statement-methods

/** @typedef {import("./types.d.ts").Dispatch} Dispatch */

/** @param {unknown[]} values */
const encodeBindValues = (values) =>
  values.map((v) => {
    // Docs says for `BLOB` column you should pass `ArrayBuffer`.
    // https://developers.cloudflare.com/d1/platform/client-api/#type-conversion
    //
    // But actually just `Array` is enough to work at the moment.
    // In addition, `Array` is helpful for us to serialize into JSON.
    if (v instanceof ArrayBuffer) return Array.from(new Uint8Array(v));
    // @ts-expect-error: `length` is missing?
    if (ArrayBuffer.isView(v)) return Array.from(v);

    return v;
  });

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

  get statement() {
    return this.#statement;
  }
  get params() {
    return this.#params;
  }

  /** @param {unknown[]} values */
  bind(...values) {
    return new D1PreparedStatement$(
      this.#statement,
      encodeBindValues(values),
      this.#dispatch,
    );
  }

  /** @param {string} [column] */
  async first(column) {
    return this._send("D1PreparedStatement.first", column);
  }

  async run() {
    return this._send("D1PreparedStatement.run");
  }

  async all() {
    return this._send("D1PreparedStatement.all");
  }

  async raw() {
    return this._send("D1PreparedStatement.raw");
  }

  /**
   * @param {string} operation
   * @param {unknown} [parameters]
   */
  async _send(operation, parameters) {
    const res = await this.#dispatch(operation, [
      this.#statement,
      this.#params,
      parameters,
    ]);
    const json = await res.json();

    return json;
  }
}
