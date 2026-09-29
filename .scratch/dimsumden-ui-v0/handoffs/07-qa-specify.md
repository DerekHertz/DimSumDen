```json
{"cell": "qa", "mode": "specify", "ticket": "dimsumden-ui-v0/07-ui-shell", "status": "ready-for-agent", "branch": "tests/dimsumden-ui-v0-07-ui-shell", "testsCommit": "8e6d364", "base": "10e69542b9a7043a1fcee049a0e439e7779b30c4"}
```

# 07 qa specify

Branch `tests/dimsumden-ui-v0-07-ui-shell`, commit 8e6d364 (tests only). Run: `node --test "apps/ui/src/state/*.test.mjs"`. All 3 files fail with ERR_MODULE_NOT_FOUND for the missing modules (the right reason). No dependencies installed.

## Files to create (developer)

- `apps/ui/src/state/apply-event.mjs`: `applyEvent(state, event) -> state | null`
- `apps/ui/src/state/connection.mjs`: `OFFLINE_AFTER_MS`, `initialConnection`, `connectionReducer`, `pillModel`, `panelPlaceholder`
- `apps/ui/src/state/live-store.mjs`: `createLiveStore({connect, fetchState, now})`

The header comment of each test file states the exact contract. Where ADR 0011 is silent, qa chose: a seq that is not prev+1 (gap, duplicate, older) returns `null` from applyEvent (client refetches /state); a change on a null state returns null; unknown types and `metrics-changed` leave data alone but advance seq; tickets stay sorted by ref; inputs are not mutated. The store adds `metricsRevision` (bumped on `metrics-changed`) for the /metrics refetch, and `tick()` to drive the 10 s offline transition. `connect` is the injected EventSource adapter (browser code is thin JSX).

## Criterion to test map

| Criterion | Test |
|---|---|
| Snapshot updates re-render without reload (test) | `live-store.test.mjs`: change frame yields a new state and notifies subscribers; last describe runs the store against a real `startBridge` over HTTP SSE and sees a ticket edit land within 3 s |
| ADR 0011 decision 5 client reducer (assigned to 07) | `apply-event.test.mjs`: ticket upsert/insert/remove, frontier, usage (and null), sessions (incl. 0), requests, seq advance and gap/duplicate/null-state to null, metrics-changed, unknown type, purity, additive keys |
| Designer spec section 1 connection pill and placeholder (Live, Reconnecting..., offline over 10 s, "Connecting to the den...") | `connection.test.mjs` |
| Page loads against a fixture bridge with no console errors (browser smoke) | human-verified / browser smoke (needs Vite build and a browser; smoke URL mode is ticket 13). Not automatable under node --test. |
| Layout (grid 1fr 440px, landmarks, a11y, themes, reduced motion, fonts) | human-verified via designer review; DOM/CSS is not testable without jsdom, which ADR 0011 excludes. Suggest the developer's smoke covers `main[aria-label="Den scene"]` and `aside[aria-label="Control panel"]`. |

## Notes for the developer

- The bridge test fixtures are imported from `apps/bridge/bridge-fixture.mjs` (relative path), so the live-store test needs no new fixture.
- The npm `test` glob `apps/**/*.test.mjs` already picks these up.
- Dependencies (react, react-dom, three 0.170.0, @react-three/fiber, vite dev) are approved, exact-pinned; the logic files must not import them.
