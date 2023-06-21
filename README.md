# cfw-bindings-wrangler-bridge

## Motivation

- Imagine using frameworks like SvelteKit and want to deploy app to Cloudflare Pages
  - You will pick `@sveltejs/adapter-cloudflare` and adapt your app
- But in local development, `vite dev` can not help you to use platform specific features like KV, D1, etc...
  - It means `platform.env.MY_KV` is always `undefined`
- Some frameworks offers way to use `wrangler pages dev` directly, but currently there is no `--remote` support
- It seems there are only 2 ways to access platform specific features remotely
  - 1: Use REST API
  - 2: Use `wrangler` CLI
- This library aims to provide mock implementation injected in local development which can access remote platform features

## Install

```
npm install -D cfw-bindings-wrangler-bridge
```

## How to use

Set up your `wrangler.toml` and start `wrangler dev` process.

```
wrangler dev --remote ./node_modules/cfw-bindings-wrangler-bridge/worker.js
```

Create and use bridge in your app for local development.

```js
import { createBridge } from "cfw-bindings-wrangler-bridge";

const MY_KV = createBridge("http://127.0.0.1:8787").KV("MY_KV");

await MY_KV.put("foo", "bar");
await MY_KV.get("foo"); // "bar"
```

### Example: SvelteKit

```js
// server.hooks.js
import { createBridge } from "cfw-bindings-wrangler-bridge";
import { dev } from "$app/environment";

const bridge = createBridge("http://127.0.0.1:8787");

export const handle = async ({ event, resolve }) => {
  // Will be removed if `dev === false`
  if (dev) {
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
## Notice
