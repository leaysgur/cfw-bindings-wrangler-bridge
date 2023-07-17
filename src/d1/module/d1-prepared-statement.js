// @ts-check

// implements D1PreparedStatement
export class D1PreparedStatement$ {
  #query;

  /** @param {string} query */
  constructor(query) {
    this.#query = query;
  }

  bind() {}
  async first() {}
  async run() {}
  async all() {}
  async raw() {}
}
