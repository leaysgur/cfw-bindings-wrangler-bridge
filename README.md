# 🌉 cfw-bindings-wrangler-bridge

Bridge between local development code and Cloudflare bindings, via `wrangler dev --remote` command.

## Motivation

Imagine you want to deploy your application to Cloudflare pages using a framework like SvelteKit.

`vite dev` is fast and DX is very good. Deployment is no problem either, with adapters available. 🥳

However, as soon as you try to use features specific to the Cloudflare platform (like KV, D1, etc.), you run into problems...

SvelteKit and `vite dev` don't know about such platform-specific features, so you can't verify any behavior during local development. 😢
(That means `platform.env.MY_KV` is always `undefined`!)

Some frameworks offer to use the `wrangler pages dev' command for local development. But this command is also locally closed, no real data is available.
(And with Vite-based frameworks, it is often impractical to use this command, as far as I know.)

By the way, this problem also occurs when developing APIs using only Pages Functions.

So this bridge 🌉 allows you to use the real data even from your local development environment via the `wrangler dev --remote` command.

## Install

```
npm install -D cfw-bindings-wrangler-bridge
```

## How to use

1️⃣ Set up your `wrangler.toml` properly and start `wrangler dev` process.

```
wrangler dev ./node_modules/cfw-bindings-wrangler-bridge/worker/index.mjs --remote
```

Of course you can interact with local environment by omitting `--remote`.

2️⃣ Create and use bridge anywhere in your app for local development.

```js
import { createBridge } from "cfw-bindings-wrangler-bridge";

/** @type {import("@cloduflare/workers-types").KVNamespace} */
const MY_KV = createBridge("http://127.0.0.1:8787").KV("MY_KV");

// ✌️ This is real KV!
await MY_KV.put("foo", "bar");
await MY_KV.get("foo"); // "bar"
```

Currently you need to update type definitions by yourself.

## Usage example

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
+const putKV = async (KV_NAMESPACE_ID, [key, value]) => {
+  const KV = createBridge("http://127.0.0.1:8787").KV(KV_NAMESPACE_ID);
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
- [ ] R2
- [ ] Service

## Notes

- Why not use REST API?
  - REST API cannot offer `--local` behavior
  - `getWithMetadata()` needs 2 separate API calls
- How about `wrangler kv:key`?
  - Features are limited, no metadata support, etc...
- `wrangler.unstable_dev()` is better?
  - Maybe? but it is literally unstable
  - I'm not sure how to ensure `await worker.stop()` on Vite process exit
    - Side-effect should be avoided...
  - Performance may suffer if repeating start/stop on every call
