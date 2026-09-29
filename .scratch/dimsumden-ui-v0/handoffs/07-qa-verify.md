```json
{
  "cell": "qa",
  "mode": "verify",
  "ticket": "dimsumden-ui-v0/07-ui-shell",
  "status": "in-review",
  "branch": "feature/dimsumden-ui-v0-07-ui-shell",
  "commit": "8dd351365216ff8dc74f40e9a97764237a6d75db",
  "current_step": "QA pass: npm test 492 pass, 0 fail, 0 skipped; qa test files unchanged",
  "artifacts": ["apps/ui/src/state/*.test.mjs", "apps/bridge/bridge-static.test.mjs"],
  "decisions": ["browser smoke criterion accepted as developer-run plus human-verified (not automatable under node --test)"],
  "failures": [],
  "pending": [
    {"item": "security review of vite/esbuild/rolldown lockfile tree", "owner": "security"},
    {"item": "designer review of shell and tokens", "owner": "designer"}
  ]
}
```

# 07 qa verify: QA pass

- `npm test`: 492 pass, 0 fail, 0 skipped.
- `git diff 8e6d364 HEAD` shows no change to qa's test files (apps/ui/src/state/*.test.mjs). Only added test: apps/bridge/bridge-static.test.mjs (5 tests, developer).
- Criteria: "Snapshot updates re-render without reload" is covered by live-store.test.mjs (change frame notifies subscribers; real startBridge SSE test). live.js subscribes the store to React state, so the wiring is thin. "Page loads with no console errors" is a browser smoke: developer ran it (Playwright, no console errors), human-verified, not automatable here.
- Files outside ticket scope: apps/bridge/server.mjs (static serving, ADR 0011 assigns to 07), apps/ci-cd/dev-server.mjs (export contentTypeFor), package.json and package-lock.json (approved deps). No judgment made.
