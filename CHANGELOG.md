# cfw-bindings-wrangler-bridge

## 0.10.1

- Fix TS defs to remove useless generics
  - It seems TS does not support `class X<T> { constructor(): T }`...
  - You need to use `new D1Database$() as D1Database` for the time being

## 0.10.0

- Refactor code base by splitting module and worker code

### Breaking changes

- Entry export `createBridge()` was removed
  - Use each binding modules like `KVNamespace$`, `D1Database$` directly
- `DirectFetcher$` is also removed, `Fetcher$` can be used instead
- Bridge worker entry has moved
  - Use `wrangler dev ./node_modules/cfw-bindings-wrangler-bridge/worker/index.js --remote`

## 0.9.3

- Finaly rollback default `wrangler` origin host part from `0.0.0.0` to `127.0.0.1`
  - `0.0.0.0` is non routable...

## 0.9.2

- Retry changing default `wrangler` origin host part from `127.0.0.1` to `0.0.0.0`
- Add CORS headers for browser usage
- Fix `KV.getWithMetadata()` w/ `null` metadata error

## 0.9.1

- Rollback default `wrangler` origin host part from `0.0.0.0` to `127.0.0.1`

## 0.9.0

- Change default `wrangler` origin host part from `127.0.0.1` to `0.0.0.0`
- Add experimental `getBindings<Env>(): Promise<Env>`

## 0.8.0

- [#18](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/18) Support Vectorize
  - Since `miniflare` does not support Vectorize yet, tested behaviors are limited

## 0.7.0

- [#15](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/15) Support Queue(Producer)

## 0.6.0

- Support `cacheStatus` property for KV

### Breaking changes

- Bridge module names are changed
  - `bridge.KV` -> `bridge.KVNamespace` and so on

## 0.5.2

- Refactoring internals
- Better README

## 0.5.1

- Refactoring internals

## 0.5.0

- [#14](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/14) Support D1

## 0.4.0

- [#12](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/12) Support R2 multipart

## 0.3.1

- [#10](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/10) Support all non-POJO values for R2
- [#11](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/11) Handle non-ASCII keys

## 0.3.0

- [#4](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/4) Internals rework

### Breaking changes

- Bridge worker file path has changed
  - ❌ `./node_modules/cfw-bindings-wrangler-bridge/worker/index.js`
  - ⭕ `./node_modules/cfw-bindings-wrangler-bridge/worker.js`
- Default TypeScript definitions for each bridges are changed from `any` to `unknown`
  - You need to add type like `bridge.KV<KVNamespace>()`

### Other updates

- `createBridge(bridgeWranglerOrigin?: string)` now defaults to `http://127.0.0.1:8787`
- Better R2 support(`R2Objects` / `R2Object` / `R2ObjectBody` shims)
- Basic tests are added
- Several small bug fixes

## 0.2.1

- Fix some bugs of R2 bridge

## 0.2.0

- [#3](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/3) Initial(but partial) support R2 bindings
  - Thanks [@ryoppippi](https://github.com/ryoppippi)!

## 0.1.1

- [#2](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/2) Fix KV key was not decoded
  - Thanks [@ryoppippi](https://github.com/ryoppippi)!

## 0.1.0

- [#1](https://github.com/leaysgur/cfw-bindings-wrangler-bridge/pull/1) Support Service bindings

## 0.0.1

- Initial release w/ KV bridge
