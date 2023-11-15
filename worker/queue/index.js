// @ts-check
import { parse } from "devalue";

/**
 * @param {any} binding
 * @returns {binding is Queue<Body>}
 */
export const isQueueBinding = (binding) =>
  binding.constructor.name === "WorkerQueue";

/**
 * @param {Queue<Body>} QUEUE
 * @param {Request} req
 */
export const handleQueueDispatch = async (QUEUE, req) => {
  const { operation, parameters } = await req.text().then((t) => parse(t));

  if (operation === "Queue.send") {
    const [body, options] = parameters;
    await QUEUE.send(body, options);

    return new Response();
  }

  if (operation === "Queue.sendBatch") {
    const [messages] = parameters;
    await QUEUE.sendBatch(messages);

    return new Response();
  }

  throw new Error(`${operation}() is not supported.`);
};
