# 139 qa specify handoff (complete)

## State
```json
{
  "ticket": "organism-infra/139-steering-auth-gate",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Specify done. Tests committed on tests/139-steering-auth-gate at 8d380a1 (no new commit this round; nothing needed fixing). Full npm test run: 1876 tests, 1810 pass, 66 fail, 0 skipped. Every failure is a 139 test failing for the missing feature (checked an error from each group): bridge-auth.test.mjs fails at file level (no routes.mjs); bridge-launch-code and bridge-requests fail on POST /session 404 (login failed: 404 not found); the production entry test gets no launch URL in 20s; session.test.mjs fails at file level (no session.mjs) and trips reachability.test.mjs until session.mjs is reachable from main.jsx; gates-model 401/403 not-retryable tests fail on retryable true; Playwright: new tests time out waiting for POST /session or [data-session=none], and the three existing keyboard tests (a/d, j/k, Ctrl+Enter) now fail with 'exactly one POST /requests, got []' because the stub answers 401 without the Bearer. No setup or syntax errors. No failure outside 139 scope was seen.",
  "artifacts": [
    "apps/bridge/bridge-auth-helpers.mjs",
    "apps/bridge/bridge-auth.test.mjs",
    "apps/bridge/bridge-launch-code.test.mjs",
    "apps/bridge/bridge-requests.test.mjs",
    "apps/ui/src/session/session.test.mjs",
    "apps/ui/src/panel/gates-model.test.mjs",
    "apps/ui/src/overlay/floating-cards.test.mjs"
  ],
  "decisions": [
    "Reload mechanism: the session token is kept in sessionStorage (per tab, dies with the tab, never sent automatically). Not a cookie (ambient credential), not localStorage (outlives tab, shared across tabs). The launch code is never stored; the fragment is stripped from the URL on success and on failure. A 401 from the bridge clears the stored token. Record in ADR 0016 decision 7; security to review.",
    "Registry seam: apps/bridge/routes.mjs exports ROUTES, rows { method, path, auth: none|origin|token, mutating }. Table tests enumerate it; a token-gated mutating row with no BODIES entry in bridge-auth.test.mjs fails the suite.",
    "Statuses fixed by the tests: no/bad Bearer 401; missing or foreign Origin, wrong or missing Content-Type, foreign Host 403; body over 4 KB 413; unknown route or unlisted method on a known path 404 with and without a token; OPTIONS 4xx with no Access-Control-Allow-*.",
    "POST /session: 200 { token } (>= 43 URL-safe chars); wrong, used, expired or burned code 401; fifth live session 429 (refused, earlier tokens keep working); non-{code:string} body is any 4xx. Refused requests (403 foreign Origin, wrong Content-Type, foreign Host) never count as failed redemptions, so a cross-site page cannot burn the user's code.",
    "startBridge option auth: { launchCode, ttlMs, now } where now() returns epoch ms; default TTL 5 min. Unknown keys in auth (disabled, token, ...) must not disable or preset anything. bridge.newLaunchCode() returns a fresh code (invented here: each code redeems once, so it is the only way to reach the 4-session cap in a test). Production entry prints http://127.0.0.1:<port>/#code=<code> once (code appears exactly once in stdout+stderr).",
    "UI seam: apps/ui/src/session/session.mjs createSession({ fetch, storage, location, history }) -> { start(), fetch(), state }. fetch waits for start, adds Authorization: Bearer, resolves { ok:false, status:401 } with no network call when there is no session. Production passes window.sessionStorage.",
    "submitGate: 401 and 403 are not retryable (message starts 'Couldn't send: ' and holds the status). It never adds a credential itself; Cards.jsx must pass the session's fetch.",
    "Playwright markup contract: element [data-session=\"none\"] (exactly one, one short line) when there is no usable session; absent otherwise; the den and Needs you card still render. The stub /requests answers 401 without the Bearer, so every existing Approve/Deny test also proves the Bearer is sent.",
    "session.mjs must be imported (transitively) from apps/ui/src/main.jsx, or reachability.test.mjs keeps failing on session.test.mjs."
  ],
  "failures": [],
  "pending": [
    { "item": "Implement: routes.mjs, auth gate in server.mjs, POST /session, launch code, newLaunchCode, console launch URL, session.mjs, Cards.jsx/App wiring and the data-session=none line, gates-model 401/403, vite proxy for /session (dev server). Then record the reload mechanism in ADR 0016 decision 7 (ADR edit is gated: ask the user).", "owner": "developer" },
    { "item": "Copy wording of the no-session line is human-verified (designer glance or orchestrator call).", "owner": "orchestrator" }
  ]
}
```

## Criterion to test map
- Table-driven auth tests from the one registry, incl. POST /requests: bridge-auth.test.mjs (registry, token-gated and origin-gated describes) and bridge-requests.test.mjs.
- Unknown route and unauthenticated known route refused before any id lookup: bridge-auth.test.mjs "no Authorization is 401, identical for a real and a bogus id", "auth runs before validation", "default deny"; bridge-requests.test.mjs "without a token even a nonexistent ref is 401".
- Launch code TTL, single use, burn after 5 failures, 4-session cap: bridge-launch-code.test.mjs (one describe each).
- Launch code never in logs: bridge-launch-code.test.mjs "never appear in logs" (console) and the entry-point test "printed exactly once".
- UI redeems #code, sends Bearer, Approve/Reject work: session.test.mjs, gates-model.test.mjs, floating-cards.test.mjs (stub enforces Bearer).
- Reload keeps session: session.test.mjs "a page reload keeps the session", floating-cards.test.mjs reload and storage tests. ADR 0016 decision 7 text: not testable, developer records it (human-verified).
- No-session one-line copy: structure tested (session.test.mjs, floating-cards.test.mjs); wording human-verified.
- Nothing disables or presets the token: bridge-launch-code.test.mjs entry-point and startBridge-option tests.

## Notes for the developer
- The production-entry tests wait 20s each for a launch URL and fail slowly until the console URL exists; the Playwright failures also take about 20s each. A red full run is about 3 minutes longer than a green one.

## Notes for security
- 429 on the fifth session lets a first redeemer hold slots (denial of service); eviction was the alternative. Chosen: refuse, so an attacker cannot log the user out.
- Not tested: sha256 + timingSafeEqual (only the observable: any token length gives 401, never 500). Vite dev proxy forwards Origin as the Vite origin, so dev-mode steering needs the one-entry allowlist the ADR mentions; not covered.
