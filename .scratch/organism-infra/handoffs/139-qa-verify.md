# 139 qa verify handoff (full verify): QA pass

## State
```json
{
  "ticket": "organism-infra/139-steering-auth-gate",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify of feat/139-steering-auth-gate at 1b28176 done. Verdict: QA pass. No test file changed since the specify commit 8d380a1 (git diff --stat 8d380a1 HEAD lists none). Orchestrator's npm test (/tmp/139-tests.txt): 1950 tests, 1949 pass, 1 fail, 0 skipped. The one failure (floating-cards.test.mjs:309, the Meta+Enter step at :326) is a pre-existing test race, not a 139 defect: reproduced on main (7c2eee1) 7 of 12 runs in isolation, and on 1b28176 5 of 12.",
  "artifacts": [
    "apps/bridge/auth.mjs",
    "apps/bridge/routes.mjs",
    "apps/bridge/server.mjs",
    "apps/ui/src/session/session.mjs",
    "apps/ui/src/overlay/floating-cards.test.mjs"
  ],
  "decisions": [
    "Flake judgement: not the Bearer. The failing assert is expectPost at line 326 (the Meta+Enter deny); the Control+Enter deny at line 320 passed. Cause: the test sends the second deny right after the first POST is seen by the stub. In Cards.jsx send() returns early while inflight.current still holds the kind (it clears only after the page processes the 202), so a fast second keypress is dropped and no POST ever arrives. Same failure on the base commit proves it predates 139. Not a load flake (it fails in isolation about half the time). Fix belongs in the test (wait for the first send to settle, e.g. the Deny label back from 'Sending...', before the Meta+Enter), qa-owned; or the app could queue instead of dropping. Recommend a small follow-up ticket; it will keep turning CI red on about half of runs until fixed.",
    "Dev mode: follow-up, not 139. Correction to the developer note: `npm run ui` is ui:build + the production bridge and works; the Vite dev server is `npm run ui:dev`. Through it, Vite forwards the browser's Origin (localhost:5173), so POST /session and POST /requests are 403 and the page shows the no-session line. That fails closed. ADR 0016 decision 6.1 says only 'if the Vite dev origin is ever allowed, it is one exact allowlist entry': optional, and the only test seam is startBridge auth options, which decision 6.1 limits to launchCode, ttlMs, now. Allowing it needs an architect call on how the entry is supplied without becoming a way to disable the check. No acceptance criterion needs it.",
    "smoke-ui.mjs change: in scope in effect. The ticket makes POST /requests token-gated, and the smoke Approve round trip needs a session; the change mints a launch code with randomBytes, passes it via the startBridge auth option and opens the page at /#code=. Nothing logs it. smoke-ui.test.mjs passes in the full run. Accept.",
    "ADR 0016 edits in 90ac7fc: decision 7 bullet matches the approved mechanism (sessionStorage, code never stored, fragment stripped, 401 clears token); decision 6 item 2 now says sessionStorage and that reload keeps the session. Two nits for the orchestrator, not blockers: (1) the bullet's heading still says 'needs the user's yes'; delete that parenthetical once the user approves, or revert the hunk if refused. (2) Decision 7's 'How the bridge is started' bullet (line 177) still says to give the user a fresh launch code 'after a page reload'; with this change it is needed after a bridge restart or a closed tab, not a reload. The user's yes on the ADR edit is still pending.",
    "Code review (done in place of the developer's skipped /code-review): gate order Host, route match, Origin, Content-Type, Bearer, then body, so nothing is read or looked up before auth; codes and tokens are sha256 + timingSafeEqual; malformed Authorization is 401 not 500; refused requests do not count as failed redemptions; 429 does not spend the code; no console.log of the code except the one printed URL. No defects found. Minor, non-blocking: failure counter is global (a local process can burn the user's code with 5 guesses; stated in the ADR residual and the specify notes); the Vite proxy still carries /session so dev mode gets a clean 403 rather than a 404."
  ],
  "failures": [],
  "pending": [
    { "item": "User yes on the ADR 0016 edit (decision 7 bullet, decision 6 item 2 sentences), plus the two wording nits above.", "owner": "orchestrator" },
    { "item": "File a follow-up ticket for the Ctrl+Enter/Meta+Enter test race (affects main CI, not only 139).", "owner": "orchestrator" },
    { "item": "File or fold into 140-143 a ticket for steering from the Vite dev server (ui:dev), needs an architect decision on the allowlist entry.", "owner": "orchestrator" },
    { "item": "Security review of the sessionStorage token mechanism and the auth gate (risk-check will hit).", "owner": "security" }
  ]
}
```

## Criterion to test map (verified present and passing in the orchestrator's run)
- Table-driven auth tests from the one registry, incl. POST /requests: bridge-auth.test.mjs, bridge-requests.test.mjs.
- Unknown and unauthenticated known routes refused before id lookup: bridge-auth.test.mjs "no Authorization is 401, identical for a real and a bogus id", "auth runs before validation", "default deny".
- Launch code TTL, single use, burn after 5, 4-session cap: bridge-launch-code.test.mjs.
- Code never in logs: bridge-launch-code.test.mjs (console, entry point printed once).
- UI redeems #code, Bearer, Approve/Reject: session.test.mjs, gates-model.test.mjs, floating-cards.test.mjs.
- Reload keeps session: session.test.mjs, floating-cards.test.mjs; ADR 0016 decision 7 text is human-verified (reviewed above).
- No-session one line: structure tested; wording `Read-only: open the launch link the bridge printed in its console to steer.` is human-verified.

## Files outside the ticket scope
apps/ci-cd/smoke-ui.mjs (judged above). vite.config.mjs (one proxy entry for /session) and styles.css (one line for the no-session line) are within the UI work.
