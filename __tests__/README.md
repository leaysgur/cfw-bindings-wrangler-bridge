# Tests

Follow steps below.

```sh
# Set up our bridge worker w/ default settings
# --persist-to .wrangler/state 
# --port 8787
wrangler dev ../worker.js

# Set up test worker w/ another cache storage
# If the same storage used, it ends up with SQL dead lock error...
wrangler dev ./test-worker.js --persist-to .wrangler/_state --port 8686

# Run all specs
curl -s 'http://127.0.0.1:8686?kv&r2&service'
# Or specify which specs to run
curl -s 'http://127.0.0.1:8686?kv'
curl -s 'http://127.0.0.1:8686?r2'
```
