// @ts-check
export { getBindings } from "./_internals/index.js";

export { KVNamespace$ } from "./kv/index.js";
export { R2Bucket$ } from "./r2/index.js";
export { D1Database$ } from "./d1/index.js";
export { WorkerQueue$ } from "./queue/index.js";
export { VectorizeIndex$ } from "./vectorize/index.js";

// Current `wrangler dev` cannot mix `--local` and `--remote` workers.
// https://github.com/cloudflare/workers-sdk/issues/1182
//
// If worker runs in `--local`,
//   it is allowed to call service(worker) running in local.
// If worker runs in `--remote`,
//   it is allowed to call service(worker) actually deployed.
// (There is no ways to call service(worker) running with `dev --remote`!)
//
// But using this bridge makes it possible by calling service(worker) directly!
export { Fetcher$ } from "./service/index.js";
