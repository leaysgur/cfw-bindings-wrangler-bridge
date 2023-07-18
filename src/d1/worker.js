// @ts-check

/**
 * @param {any} binding
 * @returns {binding is D1Database}
 */
export const isD1Binding = (binding) =>
  binding.constructor.name === "D1Database";

/**
 * @param {D1Database} D1
 * @param {Request} req
 */
export const handleD1Dispatch = async (D1, req) => {
  const { operation, parameters } = JSON.parse(
    req.headers.get("X-BRIDGE-D1-Dispatch") ?? "{}",
  );

  if (operation === "D1Database.dump") {
    const result = await D1.dump();

    return new Response(result);
  }

  if (operation === "D1Database.exec") {
    const [query] = parameters;
    const result = await D1.exec(query);

    return Response.json(result);
  }

  if (operation === "D1Database.batch") {
    const [statementArray] = parameters;
    const result = await D1.batch(
      statementArray.map(
        /** @param {[string, unknown[]]} stmt */ ([statement, params]) =>
          D1.prepare(statement).bind(...params),
      ),
    );
    return Response.json(result);
  }

  if (operation === "D1PreparedStatement.first") {
    const [statement, params, column] = parameters;
    const result = await D1.prepare(statement)
      .bind(...params)
      .first(column);

    return Response.json(result);
  }

  if (operation === "D1PreparedStatement.all") {
    const [statement, params] = parameters;
    const result = await D1.prepare(statement)
      .bind(...params)
      .all();

    return Response.json(result);
  }

  if (operation === "D1PreparedStatement.run") {
    const [statement, params] = parameters;
    const result = await D1.prepare(statement)
      .bind(...params)
      .run();

    return Response.json(result);
  }

  if (operation === "D1PreparedStatement.raw") {
    const [statement, params] = parameters;
    const result = await D1.prepare(statement)
      .bind(...params)
      .raw();

    return Response.json(result);
  }

  throw new Error(`${operation}() is not supported.`);
};
