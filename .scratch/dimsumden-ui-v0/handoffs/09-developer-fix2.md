```json
{"ticket": "dimsumden-ui-v0/09-panel-queue", "cell": "developer", "mode": "fix", "current_step": "Added blob: to CSP connect-src so glb textures load; in-review", "artifacts": ["apps/bridge/server.mjs", "apps/bridge/bridge-csp.test.mjs"], "decisions": ["img-src already allowed data: and blob:; only connect-src lacked blob:. Added it. script-src stays 'self'."], "failures": [], "pending": [{"item": "Human browser check that plush faces render (CSP fetch of blob: is not exercised by node tests)", "owner": "designer"}]}
```

# developer fix 2: 09 panel queue

## State
CSP now `connect-src 'self' blob:`. New test pins blob: in connect-src and img-src, data: in img-src, and no blob:/data: in script-src (red before, green after). Full `npm test` 616/616, 0 skipped.

## Next step
qa verify, then a browser look at the plush faces, then security, then merge.

## Gotchas
- Node tests only check the header; the actual texture load needs a browser.
