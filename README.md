# cfw-bindings-wrangler-bridge

## Motivation

- Imagine you are
  - using frameworks like SvelteKit
  - and deploy your app to Cloudflare Pages
  - with platform specific features like KV, D1, etc...
- You choose `@sveltejs/adapter-cloudflare` and adapt your app
  - It works fine in actual environment! ;D
- But in local development, `vite dev` cannot help us to use platform specific features like KV, D1, etc...
  - It means that `platform.env.MY_KV` is always `undefined`
- Some frameworks offer a way to use `wrangler pages dev` which can use platform features locally
  - but currently there is no `--remote` support
  - In addition, (maybe) this is not easy way for Vite-based frameworks...
- This library aims to solve this issue by providing a mock implementation that can be injected in local development
  - and this mock becomes bridge between running `wrangler` process which can access remote platform features

## Install

```
npm install -D cfw-bindings-wrangler-bridge
```

## How to use

Set up your `wrangler.toml` properly and start `wrangler dev` process.

```
wrangler dev ./node_modules/cfw-bindings-wrangler-bridge/worker/index.mjs --remote
```

Create and use bridge anywhere in your app for local development.

```js
import { createBridge } from "cfw-bindings-wrangler-bridge";

/** @type {import("@cloduflare/workers-types").KVNamespace} */
const MY_KV = createBridge("http://127.0.0.1:8787").KV("MY_KV");

// ✌️ This is real KV!
await MY_KV.put("foo", "bar");
await MY_KV.get("foo"); // "bar"
```

### Example: SvelteKit

```js
// server.hooks.js
import { createBridge } from "cfw-bindings-wrangler-bridge";
import { dev } from "$app/environment";

export const handle = async ({ event, resolve }) => {
  // Will be removed if `dev === false`
  if (dev) {
    const bridge = createBridge("http://127.0.0.1:8787");

    event.platform = {
      env: {
        MY_KV1: bridge.KV("MY_KV1"),
        MY_KV2: bridge.KV("MY_KV2"),
      },
    };
  }

  return resolve(event);
};
```

## Supported bindings

- [x] KV
- [ ] D1

## Notes

- Why not use REST API?
  - REST API cannot offer `--local` behavior
- `wrangler.unstable_dev()` is better?
  - It is literally unstable
  - I'm not sure how to ensure `await worker.stop()` on Vite process exit
- How about `wrangler kv:key`?
  - Limited features, no metadata support, etc...
