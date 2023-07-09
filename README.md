# 🌉 cfw-bindings-wrangler-bridge

Bridge between local development code and Cloudflare Workers bindings, via `wrangler dev --remote` command.

## Motivation

Imagine you want to deploy your application to Cloudflare Pages using a framework like SvelteKit.

`vite dev` is fast and DX is very good. Deployment is no problem either, with adapters available. GitHub connected auto CI, preview branches are really nice. 🥳

However, as soon as you try to use features specific to the Cloudflare Workers platform (like KV, D1, etc.), you run into problems...

SvelteKit and `vite dev` don't know about such platform-specific features, so you can't verify any behavior during local development. 😢
(That means `platform.env.MY_KV` is always `undefined`!)

Some frameworks offer to use the `wrangler pages dev` command for local development. But this command is also locally closed, no real data is available.
(And with Vite-based frameworks, it is often impractical to use this command, as far as I know.)

Some frameworks also have implementations using `@cloudflare/miniflare` in their adapters. But even in this case, you can only access locally closed data.

This problem also occurs when developing APIs using only Pages Functions via `wrangler pages dev`.

That is where this bridge 🌉 comes in!
This bridge(module + worker) allows you to access the real data even from your local development environment, via the `wrangler dev --remote` command.

## Install

```
npm install -D cfw-bindings-wrangler-bridge
```

## How to use

1️⃣ Set up your `wrangler.toml` properly and start `wrangler dev` process.

```
wrangler dev ./node_modules/cfw-bindings-wrangler-bridge/worker.js --remote
```

Of course you can interact with local environment by omitting `--remote`.

2️⃣ Create and use bridge anywhere in your app for local development.

```js
import { createBridge } from "cfw-bindings-wrangler-bridge";

// Default origin is `http://127.0.0.1:8787`
const bridge = createBridge();
// Or manually
// const bridge = createBridge("http://localhost:3000");

/** @type {import("@cloduflare/workers-types").KVNamespace} */
const MY_KV = bridge.KV("MY_KV");

// ✌️ This is real KV!
await MY_KV.put("foo", "bar");
await MY_KV.get("foo"); // "bar"
```

Currently type definitions should be handled by yourself. 😅

## Supported bindings

### KV

- [x] `.list()`
- [x] `.get()`
- [x] `.getWithMetadata()`
- [x] `.put()`
- [x] `.delete()`

### SERVICE

- [x] `.fetch()`

📝 Service bindings bridge can be used in 2 modes.

```js
// [1] Normal mode
const MY_SERVICE = bridge.SERVICE("MY_SERVICE");

// [2] Direct mode:
const MY_SERVICE = bridge.SERVICE("", "http://127.0.0.1:8686");
```

In direct mode, you can mix `wrangler dev --remote` and `wrangler dev --local`.
At this time, however, the value of `request.origin` will be different from the actual environment.

> See also https://github.com/cloudflare/workers-sdk/issues/1182

### R2

- [x] `.list()`
- [x] `.head()`
- [x] `.get()`
- [x] `.put()`
- [x] `.delete()`
- [ ] `.createMultipartUpload()`
- [ ] `.resumeMultipartUpload()`

## Usage examples

### CLI tool

If you are using REST API in your CLI, now you can replace it.

```diff
-const putKV = async (API_KEY, API_URL, [key, value]) => {
-  const res = await fetch(`${API_URL}/values/${key}`, {
-    method: "PUT",
-    headers: { Authorization: `Bearer ${API_KEY}` },
-    body: value,
-  });
-
-  const json = await res.json();
-  if (!json.success)
-    throw new Error(json.errors.map(({ message }) => message).join("\n"));
-};
+import { createBridge } from "cfw-bindings-wrangler-bridge";
+
+const putKV = async (KV_BINDING_NAME, [key, value]) => {
+  const KV = createBridge().KV(KV_BINDING_NAME);
+  await KV.put(key, value);
+};
```

### SvelteKit

```js
// server.hooks.js
import { createBridge } from "cfw-bindings-wrangler-bridge";
import { dev } from "$app/environment";

export const handle = async ({ event, resolve }) => {
  // Will be removed if `dev === false`
  if (dev) {
    const bridge = createBridge();

    event.platform = {
      env: {
        SESSIONS: bridge.KV("SESSIONS"),
        TODOS: bridge.KV("TODOS"),
      },
    };
  }

  return resolve(event);
};
```

## Notes

- Why not use REST API?
  - REST API cannot offer `--local` behavior
  - `KV.getWithMetadata()` needs 2 separate API calls
  - `KV.put()` requires using `FormData` with serialized `string`
  - `R2.*()` are all not supported
- How about using `wrangler` CLI commands?
  - Features are limited, no KV metadata support, etc...
- `wrangler.unstable_dev()` is better?
  - Maybe? but it is literally unstable
  - I'm not sure how to ensure `await worker.stop()` on Vite process exit
    - Side-effect should be avoided...
  - Performance may suffer if repeating start/stop on every call
  - Someone may use a fixed version of `wrangler` for some reason
