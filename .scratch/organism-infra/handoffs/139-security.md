# 139 security handoff: Security pass

## State
```json
{
  "ticket": "organism-infra/139-steering-auth-gate",
  "cell": "security",
  "current_step": "Full security review of feat/139-steering-auth-gate at 1b28176 done. Verdict: Security pass. No critical or high findings; two medium and two low, none blocking. gitleaks over origin/main..1b28176 (3 commits): no leaks. npm audit: 0 vulnerabilities. No change to package.json, package-lock.json or .github/, so no dependency or CI gate applies.",
  "artifacts": [
    "apps/bridge/auth.mjs",
    "apps/bridge/routes.mjs",
    "apps/bridge/server.mjs",
    "apps/ui/src/session/session.mjs",
    "apps/ui/src/session/useSession.js",
    "apps/ci-cd/smoke-ui.mjs",
    "docs/adr/0016-ui-steering-channel.md"
  ],
  "decisions": [
    "Bridge gate (pass): binds 127.0.0.1 only (server.mjs:18,199); Host check unchanged (server.mjs:40). Order is Host, route match, Origin (required, exact same-origin), Content-Type, Bearer, then body, so nothing is read or looked up before auth (server.mjs:55-90). Default deny via one registry (routes.mjs). Codes and tokens are 32 random bytes, stored as sha256 digests, compared with timingSafeEqual; verify() has no early exit; malformed Authorization is 401 (auth.mjs:51-58). Code single use, 5 minute TTL, 5 failures burn all codes, 4-session cap refuses rather than evicts, a 429 does not spend the code. Token only from the Authorization header. The only console output carrying a code is the one printed URL at server.mjs:221; no log, error body or snapshot carries a code or token.",
    "SESSIONSTORAGE TOKEN (ADR 0016 decision 7 asks for this view). Verdict: acceptable, approve as built, with one stated residual (medium, below). What it gets right: launch code never stored (session.mjs:70-81, only the token is written); #code stripped via replaceState after redemption whether it succeeded or failed (session.mjs:73-75); a 401 clears the stored token and re-renders the no-session line (session.mjs:92); token goes only in an Authorization header, so the browser never attaches it on its own and a cross-site page has no ambient credential to ride (a cookie would have; localStorage would outlive the tab and be shared across tabs); storage failure degrades to memory only; one module-level session so a remount cannot spend the single-use code twice; a failed redemption falls back to the stored token so a stale tab or a reused link does not log the user out. XSS: sessionStorage is readable by injected script, but an XSS in this origin could already drive fetch through the in-memory session, so memory-only would not have bought real protection; the CSP (script-src 'self', no inline script, server.mjs CSP) is the actual control, and no innerHTML or dangerouslySetInnerHTML was added.",
    "Medium M1, residual of the sessionStorage choice (apps/ui/src/session/session.mjs:7,31): browsers persist sessionStorage to the profile directory for session restore (Chrome keeps a 'Session Storage' leveldb under the profile, and it can outlive the tab until the browser trims it). Any process on the account, including a cell, can read it, which is the same class of exposure ADR 0016 decision 6.2 used to reject writing the token to a 0600 file. The token has no expiry and lives until the bridge stops. Not blocking: the user approved the mechanism, a same-account reader can already read the snapshot and history database, the bridge restart ends every token, and I did not verify the on-disk behaviour empirically for the user's browser (stated from how Chromium and WebKit implement session restore). Cheap mitigations if the user wants them, in order: (a) add an idle or absolute expiry to tokens in auth.mjs (for example 8 hours) so a stale disk copy goes dead; (b) say the residual plainly in decision 7. Recommend (b) now and (a) as a follow-up ticket.",
    "Medium M2 (docs/adr/0016-ui-steering-channel.md decision 6 item 2 and decision 7 bullet): the ADR edit is accurate to the code, but it does not state the on-disk residual in M1, and decision 7's 'How the bridge is started' bullet still says a fresh launch code is needed 'after a page reload'. Both are the orchestrator's pending ADR wording pass already noted by qa; add M1's residual to the same pass. ADR edit still needs the user's yes.",
    "Low L1 (apps/bridge/auth.mjs:37): the failure counter is global, so a local process that supplies a same-origin Origin header (trivial for a non-browser client) can burn the user's launch code with 5 wrong guesses. Denial of the launch code only, never a grant: guessing 256 bits is infeasible. Already stated in the ADR residual; recovery is a bridge restart.",
    "Low L2 (apps/ci-cd/smoke-ui.mjs:91-93,107): launch code minted per run with randomBytes, passed to startBridge through the auth option and to the page as /#code=; bridge is bound to loopback on an ephemeral port in a fixture root, code is single use and dies when the process ends, and nothing in the file logs it or writes it to disk or argv. Fixture only, no real secret. Accept. (Note this is the test seam ADR decision 6.1 allows: launchCode, ttlMs, now only; createAuth reads nothing else.)",
    "vite.config.mjs: adds /session to the dev proxy. Through ui:dev the browser's Origin is the Vite origin, so POST /session and /requests fail closed with 403. Correct and safe; steering from the dev server is a follow-up (needs an architect call on an allowlist entry that cannot double as a way to disable the check), not a security defect.",
    "Dependencies: none added or upgraded. Secrets: gitleaks (installed at /opt/homebrew/bin/gitleaks, not ~/.local/bin) found nothing in origin/main..1b28176. /security-review was not run separately; I reviewed the diff by hand against the bridge, auth, UI session and smoke files, and read qa's verify handoff and the developer's."
  ],
  "failures": [],
  "pending": [
    { "item": "User yes on the ADR 0016 edit; fold M1's on-disk residual and the 'after a page reload' wording fix into the same pass (M2).", "owner": "orchestrator" },
    { "item": "Optional follow-up ticket: absolute or idle expiry for session tokens (M1 mitigation a).", "owner": "orchestrator" }
  ]
}
```

## Findings

| # | file:line | severity | why |
|---|---|---|---|
| M1 | apps/ui/src/session/session.mjs:7,31 | medium | sessionStorage can be persisted to the browser profile for session restore, readable by any same-account process; no token expiry |
| M2 | docs/adr/0016-ui-steering-channel.md (decision 7 bullet, line 177) | medium | residual not stated; stale "after a page reload" wording |
| L1 | apps/bridge/auth.mjs:37 | low | global failure counter lets a local process burn the launch code (denial only) |
| L2 | apps/ci-cd/smoke-ui.mjs:91-107 | low | informational: fixture launch code handled safely; accept |

## Verdict
Security pass. Critical or high findings: none.
