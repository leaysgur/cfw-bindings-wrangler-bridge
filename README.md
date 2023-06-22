# 🌉 cfw-bindings-wrangler-bridge

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

1️⃣ Set up your `wrangler.toml` properly and start `wrangler dev` process.

```
wrangler dev ./node_modules/cfw-bindings-wrangler-bridge/worker/index.mjs --remote
```

2️⃣ Create and use bridge anywhere in your app for local development.

```js
import { createBridge } from "cfw-bindings-wrangler-bridge";

/** @type {import("@cloduflare/workers-types").KVNamespace} */
const MY_KV = createBridge("http://127.0.0.1:8787").KV("MY_KV");

// ✌️ This is real KV!
await MY_KV.put("foo", "bar");
await MY_KV.get("foo"); // "bar"
```

### Example: CLI tool

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
+const putKV = async (KV_NAMESPACE_ID, [key, value]) => {
+  const KV = createBridge("http://127.0.0.1:8787").KV(KV_NAMESPACE_ID);
+  await KV.put(key, value);
+};
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
- [ ] R2

## Notes

- Why not use REST API?
  - REST API cannot offer `--local` behavior
  - `getWithMetadata()` needs 2 separate API calls
- How about `wrangler kv:key`?
  - Features are limited, no metadata support, etc...
- `wrangler.unstable_dev()` is better?
  - Maybe? but it is literally unstable
  - I'm not sure how to ensure `await worker.stop()` on Vite process exit
  - For CLI usage, it may be worth
