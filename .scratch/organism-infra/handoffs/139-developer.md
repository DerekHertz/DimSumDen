# 139 developer handoff

## State
```json
{
  "ticket": "organism-infra/139-steering-auth-gate",
  "cell": "developer",
  "current_step": "Implemented on feat/139-steering-auth-gate (2 commits on top of tests 8d380a1). All 139 tests pass. Full npm test (scout, before the smoke fix): 1950 tests, 1949 pass, 1 fail (smoke-ui Approve round trip, needed a session); fixed in the second commit and smoke-ui.test.mjs re-run green (4/4). One Playwright test (Ctrl+Enter in the Note) failed once under load in a combined run (21s timeout) and passed alone; looks like load flake, not re-checked in a final full run. The /code-review step was NOT run (context budget); qa verify covers it.",
  "artifacts": [
    "apps/bridge/routes.mjs",
    "apps/bridge/auth.mjs",
    "apps/bridge/server.mjs",
    "apps/ui/src/session/session.mjs",
    "apps/ui/src/session/useSession.js",
    "apps/ui/src/App.jsx",
    "apps/ui/src/overlay/Cards.jsx",
    "apps/ui/src/panel/gates-model.mjs",
    "apps/ui/src/styles.css",
    "apps/ui/vite.config.mjs",
    "apps/ci-cd/smoke-ui.mjs",
    "docs/adr/0016-ui-steering-channel.md"
  ],
  "decisions": [
    "Gate order in server.mjs passesGate: Host (403) -> route match (404, default deny) -> Origin required and same-origin (403) -> Content-Type JSON (403) -> Bearer (401) -> body read (413/400). Nothing is read before auth.",
    "auth.mjs: sha256 + timingSafeEqual for codes and tokens; failures counter is global (5 wrong guesses burn every live code, then reset); a 429 does not spend the code; expired code is removed on use. Only launchCode, ttlMs, now are read from the auth option.",
    "startBridge with no auth.launchCode has no live code until newLaunchCode() is called; the production entry mints one and prints 'to steer, open (one use, 5 minutes): http://127.0.0.1:<port>/#code=<code>' once.",
    "UI: session.mjs adds subscribe() (so a 401 mid-session re-renders the no-session line). Failed redemption falls back to a stored token if one exists. useSession.js holds one module-level session so a remount never redeems twice.",
    "gates-model: 401/403 message is 'Couldn't send: not signed in to steer (401)', not retryable.",
    "smoke-ui.mjs (outside the listed test files, needed): starts the bridge with a launch code and opens the page at /#code=<code>.",
    "ADR 0016: added a decision 7 bullet 'Reload keeps the session' (sessionStorage token, launch code never stored, #code stripped on success and failure, 401 clears the token, bridge restart drops tokens) and changed two sentences in decision 6 item 2 that said the token is in memory / reload loses it. NEEDS THE USER'S YES; revert the commit hunk if refused."
  ],
  "failures": [],
  "pending": [
    { "item": "User yes on the ADR 0016 edit (decision 7 bullet plus two decision 6 item 2 sentences).", "owner": "orchestrator" },
    { "item": "User or designer glance at the no-session copy (quoted below).", "owner": "orchestrator" },
    { "item": "qa verify; include a /code-review style pass (not done by the developer). Security: vite dev proxy forwards a Vite Origin, so dev-mode steering via npm run ui is refused (403) until the allowlist entry the ADR mentions is added; only /session was added to the proxy.", "owner": "qa" }
  ]
}
```

## No-session copy (verbatim)
`Read-only: open the launch link the bridge printed in its console to steer.`
Rendered as `<p data-session="none" role="status">` above the Needs you card in the `.cards` column; one line, 76 characters. It is the single `NO_SESSION_MESSAGE` constant in `apps/ui/src/session/session.mjs`.

## Notes
- Dev mode (`npm run ui` through Vite) is not covered by tests: the proxy sends Origin as the Vite origin, so POST /requests would be 403 there. Production bridge on 4317 works.
- The bridge console URL goes to stdout once; the code appears nowhere else (tests assert this).
