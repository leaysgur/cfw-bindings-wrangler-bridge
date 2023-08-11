# Tests

## How to run

Follow steps below.

```sh
# Set up our bridge worker w/ default settings for testing
# --persist-to .wrangler/state
# --port 8787
# Uses `wrangler.toml` for `test-runner`
wrangler dev ../worker.js

# Set up test-runner worker w/ another cache storage
# If the same storage used, it ends up with SQL dead lock error...
# Also uses `wrangler.toml` for `test-runner`
wrangler dev ./runner-worker.js --persist-to .wrangler/_state --port 8686

# Run all specs
curl -sN 'http://127.0.0.1:8686?t=kv&t=r2&t=d1&t=queue'
# Or specify which specs to run
curl -sN 'http://127.0.0.1:8686?t=kv'
curl -sN 'http://127.0.0.1:8686?t=r2'
```

If you test SERVICE bindings, extra steps are required in advance.

```sh
cd ./test-service
wrangler dev ./service.js --port 8585
```

## Testing plan

What should be tested is

- ACTUAL bindings: by our bridge implementation

and

- EXPECT bindings: by `wrangler dev`

accept the same inputs and return the same outputs.

The results(e.g. `delete()` surely delete entry) is not our concern.

And support only the latest version of `wrangler`.
