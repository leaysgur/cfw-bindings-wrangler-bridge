# cfw-bindings-wrangler-bridge

This module makes it possible to interact with **remote** Cloudflare Workers bindings(like KV, D1, etc...) from anywhere you want.

In a nutshell, you can use actual KV, D1 APIs and its data with `vite dev`! 😉

## ✋ Before proceeding

If your purpose is to mock bindings only for local development and no initial data is needed or can be easily prepared, this library may not be needed.

In this case, we recommend using [`cloudflare/miniflare@3`](https://github.com/cloudflare/miniflare) as API(`getBindings()` + `dispose()`). It is the official, most reliable implementation and well supported.

Some of frameworks may have its own support for `miniflare` in their adapters like [SolidStart](https://github.com/solidjs/solid-start/tree/main/packages/start-cloudflare-pages).

If those do not match for your case or you really need the remote data, please go ahead. 🤤

## Install

```sh
npm install -D cfw-bindings-wrangler-bridge
```

## Basic usage

2 options are available.

### Option 1️⃣: With external `wrangler dev` process

Set up your `wrangler.toml` properly and start `wrangler dev` process in advance.

```sh
wrangler dev ./node_modules/cfw-bindings-wrangler-bridge/worker/index.js --remote
```

Of course you can interact with local environment by omitting `--remote`. All the other options(like `--persist-to`) are also available.

Then, create bridge modules and use them anywhere in your code.

```js
import { KVNamespace$, D1Database$ } from "cfw-bindings-wrangler-bridge";

/** @type {import("@cloduflare/workers-types").KVNamespace} */
const MY_KV = new KVNamespace$("MY_KV");
// For TypeScript
// const MY_KV = KVNamespace$<KVNamespace>("MY_KV");

// ✌️ This is remote KV!
await MY_KV.put("foo", "bar");
await MY_KV.get("foo"); // "bar"

// Or specify default origin
const OUR_DB = new D1Database$("OUR_DB", {
  // Default is `http://127.0.0.1:8787`
  bridgeWorkerOrigin: "http://localhsot:8686",
});
// ✌️ This is remote D1!
await OUR_DB.prepare("SELECT * FROM todos").all();
```

This is isomorphoc approach, your module can be run on everywhere.

### Options 2️⃣: With `unstable_dev()` API from `wrangler` package

Set up your `wrangler.toml` properly and create `UnstableDevWorker` instance.

```js
import { unstable_dev } from "wrangler";
import { R2Bucket$ } from "cfw-bindings-wrangler-bridge";

const worker = await unstable_dev(
  "./node_modules/cfw-bindings-wrangler-bridge/worker.js",
  {
    local: false,
    // config: "./path/to/your/wrangler.toml",
    experimental: { disableExperimentalWarning: true },
  },
);

const R2 = new R2Bucket$("ASSETS", {
  fetchImpl: worker.fetch.bind(worker),
});

// ✌️ This is remote R2!
const list = await R2.list();

// Don't forget!
await worker.stop();
```

This is Node.js only option since `wrangler` package depends on Node.js.

### Advanced usage

Create multiple module instances at once by `getBindings()` helper.

```ts
import { getBindings } from "cfw-bindings-wrangler-bridge";

const env = await getBindings<{
  TODOS: KVNamespace;
  SESSIONS: KVNamespace;
}>();

const user = await env.SESSIONS.get("abc", "json");
const todos = await env.TODOS.get(user.id);
```

Mixing local and remote bindings.

> https://github.com/cloudflare/workers-sdk/issues/1182

It is also possible for any kinds of bindings.

```js
import { Fetcher$ } from "cfw-bindings-wrangler-bridge";

const AUTH_SERVICE = new Fetcher$("AUTH", {
  bridgeWorkerOrigin: "http://127.0.0.1:3000",
});

const CART_SERVICE = new Fetcher$("CART", {
  bridgeWorkerOrigin: "http://127.0.0.1:4000",
});
```

## Supported bindings

| binding                                                                              | module            | support | memo                                           |
| :----------------------------------------------------------------------------------- | :---------------- | :-----: | :--------------------------------------------- |
| [KV namespace](https://developers.cloudflare.com/workers/runtime-apis/kv/)           | `KVNamespace$`    |   💯    |                                                |
| [R2 bucket](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) | `R2Bucket$`       |   💯    |                                                |
| [D1 database](https://developers.cloudflare.com/d1/platform/client-api/)             | `D1Database$`     |   💯    |                                                |
| [Service](https://developers.cloudflare.com/workers/runtime-apis/service-bindings/)  | `Fetcher$`        |   💯    |                                                |
| [Queue](https://developers.cloudflare.com/queues/platform/javascript-apis/)          | `WorkerQueue$`    |   💯    | Producer usage only                            |
| [Vectorize](https://developers.cloudflare.com/vectorize/platform/client-api/)        | `VectorizeIndex$` |   💯    | `--remote` only [for now](#vectorize-bindings) |

More to come...?


### Latest tested `wrangler` version

v3.15.x

## How it works

This bridge has 2 components.

- Module: Mock module to be `import`ed into your application
  - written as pure ESM
- Worker: Proxy worker to be called by the bridge module
  - hosted by `wrangler dev --remote` in advance

Since bridge module itself is platform agnostic, you can use it on any platform|environment.

- Vite based meta frameworks local development
- CLI tools
- Static Site Generation, Pre-rendering
- Cloudflare Workers in local(`warngler dev`)
- Outside of Cloudflare stack(just deploy `worker.js` for your env and use with `createBridge("https://example.com")`)
- etc...

## Known limitations

### Compatibility issues

The instances and values available from this bridge are not 100% compatible.

For example,

- Binding instances
  - The class constructors like `KVNamespace`, `R2Object`(aka `HeadResult`) are not publicly exposed
- Enumerable instance properties
  - Read-only properties are emulated by simple implementation
  - Some private properties and methods are included
- Exception
  - Not a specific error like `TypeError`, but just an `Error`
- etc...

But I don't think there are any problems in practical use.

### Max limits for API call

For example, KV has a limitation of only being able to call the API up to 1000 operations per 1 worker invocation.

However, via this bridge, the API call becomes a separate worker invocation, which circumvents that limitation.

This may be a problem after you deployed that worker.

### Vectorize bindings

Since `wrangler(miniflare)` does not support Vectorize yet, you need `--remote` to interact with Vectorize binding.

> https://github.com/cloudflare/workers-sdk/issues/4360

## Examples

### CLI

<details>

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
+import { KVNamespace$ } from "cfw-bindings-wrangler-bridge";
+
+const putKV = async (KV_BINDING_NAME, [key, value]) => {
+  const KV = new KVNamespace$(KV_BINDING_NAME, { fetchImpl });
+  await KV.put(key, value);
+};
```

</details>

### SvelteKit local development

<details>

Be sure to wrap with `if (dev) {}`, not to be included in production build.

```js
// server.hooks.js
import { KVNamespace$, D1Database$ } from "cfw-bindings-wrangler-bridge";
import { dev } from "$app/environment";

export const handle = async ({ event, resolve }) => {
  if (dev) {
    event.platform = {
      env: {
        SESSIONS: new KVNamespace$("SESSIONS"),
        TODOS: new D1Database$("TODOS"),
      },
    };
  }

  return resolve(event);
};
```

</details>

### Astro local development

<details>

Be sure to wrap with `if (import.meta.env.DEV) {}`, not to be included in production build.

```astro
---
// your-page.astro
import { getRuntime } from "@astrojs/cloudflare/runtime";
import { KVNamespace$ } from "cfw-bindings-wrangler-bridge";

let runtime = getRuntime(Astro.request) ?? {};
if (import.meta.env.DEV) {
  runtime.env = {
    NEWS: new KVNamespace$("NEWS"),
  };
}
---

<!-- ... -->
```

</details>
