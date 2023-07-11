# 🌉 cfw-bindings-wrangler-bridge

## 0.3.0

- [#4](https://github.com/leader22/cfw-bindings-wrangler-bridge/pull/4) Internals rework

### Breaking changes

- Bridge worker file path has changed
  - ❌ `./node_modules/cfw-bindings-wrangler-bridge/worker/index.js`
  - ⭕ `./node_modules/cfw-bindings-wrangler-bridge/worker.js`

### Other updates

- `createBridge(bridgeWranglerOrigin?: string)` now defaults to `http://127.0.0.1:8787`
- Better R2 support(`R2Objects` / `R2Object` / `R2ObjectBody` shims)

## 0.2.1

- Fix some bugs of R2 bridge

## 0.2.0

- [#3](https://github.com/leader22/cfw-bindings-wrangler-bridge/pull/3) Initial(but partial) support R2 bindings
  - Thanks [@ryoppippi](https://github.com/ryoppippi)!

## 0.1.1

- [#2](https://github.com/leader22/cfw-bindings-wrangler-bridge/pull/2) Fix KV key was not decoded
  - Thanks [@ryoppippi](https://github.com/ryoppippi)!

## 0.1.0

- [#1](https://github.com/leader22/cfw-bindings-wrangler-bridge/pull/1) Support Service bindings

## 0.0.1

- Initial release w/ KV bridge
