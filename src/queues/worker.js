// @ts-check
import { parse } from "devalue";

/**
 * @param {any} binding
 * @returns {binding is Queue}
 */
export const isQueuesBinding = (binding) =>
  binding.constructor.name === "WorkerQueue";

/**
 * @param {Queue<Body>} QUEUE
 * @param {Request} req
 */
export const handleQueuesDispatch = async (QUEUE, req) => {
  const { operation, parameters } = await req.text().then((t) => parse(t));

  if (operation === "Queue.send") {
    const [body] = parameters;
    await QUEUE.send(body);

    return new Response();
  }

  if (operation === "Queue.sendBatch") {
    const [messages] = parameters;
    await QUEUE.sendBatch(messages);

    return new Response();
  }

  throw new Error(`${operation}() is not supported.`);
};
