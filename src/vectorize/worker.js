// @ts-check
import { parse } from "devalue";

/**
 * @param {any} binding
 * @returns {binding is VectorizeIndex}
 */
export const isVectorizeBinding = (binding) =>
  binding.constructor.name === "VectorizeIndexImpl";

/**
 * @param {VectorizeIndex} VECTORIZE
 * @param {Request} req
 */
export const handleVectorizeDispatch = async (VECTORIZE, req) => {
  const { operation, parameters } = await req.text().then((t) => parse(t));

  if (operation === "VectorizeIndex.describe") {
    const result = await VECTORIZE.describe();

    return Response.json(result);
  }

  if (operation === "VectorizeIndex.query") {
    const [vector, options] = parameters;
    const result = await VECTORIZE.query(vector, options);

    return Response.json(result);
  }

  if (operation === "VectorizeIndex.insert") {
    const [vectors] = parameters;
    const result = await VECTORIZE.insert(vectors);

    return Response.json(result);
  }
  
  if (operation === "VectorizeIndex.upsert") {
    const [vectors] = parameters;
    const result = await VECTORIZE.upsert(vectors);

    return Response.json(result);
  }

  if (operation === "VectorizeIndex.deleteByIds") {
    const [ids] = parameters;
    const result = await VECTORIZE.deleteByIds(ids);

    return Response.json(result);
  }

  if (operation === "VectorizeIndex.getByIds") {
    const [ids] = parameters;
    const result = await VECTORIZE.getByIds(ids);

    return Response.json(result);
  }

  throw new Error(`${operation}() is not supported.`);
};

