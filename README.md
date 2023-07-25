# cfw-bindings-wrangler-bridge

This bridge makes it possible to interact with Cloudflare Workers bindings(like KV, D1, etc...) runtime APIs **in local development**.

> In a nutshell, you can use actual KV, D1 APIs and values during `vite dev`! 😉

## How it works

This bridge has 2 components.

- Module: Mock module to be injected into the user application
  - written as pure ESM
- Worker: Proxy worker to be called by the bridge module
  - hosted by `wrangler dev (--remote)` in advance

Since bridge module itself is platform agnostic, you can use it on any platform|environment.

- Vite based meta frameworks(Node.js)
- CLI tools(Bun, Node.js)
- Static Site Generation, Pre-rendering(Bun, Node.js)
- Cloudflare Workers in local(`warngler dev`)
- etc...

## Usage

0️⃣ Install it as usual.

```sh
npm install -D cfw-bindings-wrangler-bridge
```

1️⃣ Set up your `wrangler.toml` properly and start `wrangler dev` process.

```sh
wrangler dev ./node_modules/cfw-bindings-wrangler-bridge/worker.js --remote
```

Of course you can interact with local environment by omitting `--remote`.

2️⃣ Create bridge and use it anywhere in your app.

```js
import { createBridge } from "cfw-bindings-wrangler-bridge";

// Default origin is `http://127.0.0.1:8787`
const bridge = createBridge();
// Or
// const bridge = createBridge("http://localhost:3000");

/** @type {import("@cloduflare/workers-types").KVNamespace} */
const MY_KV = bridge.KVNamespace("MY_KV");
// For TypeScript
// const MY_KV = bridge.KV<KVNamespace>("MY_KV");

// ✌️ This is production KV!
await MY_KV.put("foo", "bar");
await MY_KV.get("foo"); // "bar"
```

Type definitions should be handled by yourself. 😅

## Supported bindings

- [KV namespace](https://developers.cloudflare.com/workers/runtime-apis/kv/)
  - All operations and arguments are supported 💯
  - `bridge.KVNamespace()`
- [Service](https://developers.cloudflare.com/workers/runtime-apis/service-bindings/)
  - All operations and arguments are supported 💯
  - `bridge.Fetcher()`
- [R2 bucket](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
  - All operations and arguments are supported 💯
  - `bridge.R2Bucket()`
- [D1 database](https://developers.cloudflare.com/d1/platform/client-api/)
  - All operations and arguments are supported 💯
  - `bridge.D1Database()`
- [Queue(producer only)](https://developers.cloudflare.com/queues/platform/javascript-apis/)
  - All operations and arguments are supported 💯
  - `bridge.Queue()`
- More to come...

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
+import { createBridge } from "cfw-bindings-wrangler-bridge";
+
+const putKV = async (KV_BINDING_NAME, [key, value]) => {
+  const KV = createBridge().KVNamespace(KV_BINDING_NAME);
+  await KV.put(key, value);
+};
```

</details>

### SvelteKit

<details>

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
        SESSIONS: bridge.KVNamespace("SESSIONS"),
        TODOS: bridge.D1Database("TODOS"),
      },
    };
  }

  return resolve(event);
};
```

</details>

## Known limitations

### Compatibility issues

The instances and values available from this module are not 100% compatible.

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

### Service bindings

Current `wrangler` implementation does not allow us to mix `wrangler dev (--local)` services and `wrangler dev --remote` services.

> See also https://github.com/cloudflare/workers-sdk/issues/1182

But with this bridge, you can get over it.

```js
// Normal mode
// const MY_SERVICE = bridge.Fetcher("MY_SERVICE");

// Direct mode
const MY_SERVICE = bridge.Fetcher("", "http://127.0.0.1:8686");
```

With direct mode, you can mix `wrangler dev --remote` and `wrangler dev (--local)`.
At this time, however, the value of `request.origin` will be different from the actual environment.

## Implementation notes

- Why not use REST API?
  - REST API cannot offer `--local` behavior
  - Not all bindings are supported
- How about using `wrangler` CLI commands?
  - Features are limited too, no KV metadata support, etc...
- `wrangler.unstable_dev()` is better?
  - Maybe? but it is literally unstable
  - I'm not sure how to ensure `await worker.stop()` on Vite process exit
    - Side-effect should be avoided...
  - Performance may suffer if repeating start/stop on every call?
  - I don't want to care which version of `wrangler` to be used, supported
    - Someone may use a fixed version of `wrangler` for some reason
