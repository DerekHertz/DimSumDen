# 140 security review: pass

Branch `feat/140-steering-host-core` at db9fc50 against `origin/main`. Full review (risk-check hit, 13 hits). Reviewed by hand; no dependency, workflow or branch-protection change in the diff (package.json, lockfile and .github are untouched).

```json
{
  "ticket": "organism-infra/140-steering-host-core",
  "cell": "security",
  "current_step": "Security pass. No critical or high finding. Four low findings (the qa non-blocking four) ruled non-blocking; one medium-to-low note on shutdown hang folded into finding 3. gitleaks over origin/main..db9fc50: 4 commits, no leaks.",
  "artifacts": [
    "apps/bridge/cells/host.mjs",
    "apps/bridge/cells/sessions.mjs",
    "apps/bridge/cells/policy.mjs",
    "apps/bridge/cells/runtime.mjs",
    "apps/bridge/server.mjs",
    "apps/bridge/routes.mjs",
    "apps/bridge/watch.mjs",
    "scripts/risk-check.mjs"
  ],
  "decisions": [
    "Finding 1 (host.mjs:27, literal bidi characters in the clean() regex): low, non-blocking. The behaviour is right and the characters sit in a neutraliser, not in executable logic, but raw bidi controls in source are the Trojan-Source class (they can reorder what a reviewer sees). Fix: write them as \\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069 escapes. Worth a follow-up repo check (grep for bidi controls in .mjs under npm test).",
    "Finding 2 (host.mjs:113-114, run.finally derived promise has no handler): low, non-blocking. Reachable only if spawnAgent throws, e.g. onChange/hub.publish throws; the same applies to agent.finished (host.mjs:134) if finalize's publish throws. Result is an uncaughtException, which shuts every agent down and exits 1: fails closed, no escalation. Fix: add .catch(() => {}) on the derived promise and on agent.finished.",
    "Finding 3 (host.mjs:249, shutdown awaits pending spawns with no bound): low now (the fake resolves), medium once D2 lands if a real spawn can hang. A hung spawn would stall the SIGINT/SIGTERM/SIGHUP and uncaughtException handlers (they only exit after shutdown() settles), so the bridge could not be stopped except by SIGKILL. Fix for D2: race the pending wait against a bounded timeout (graceMs times 3) and killAllSync afterward; carry as a D2 acceptance criterion.",
    "Finding 4 (host.mjs:25-29, zero-width U+200B-U+200D, U+2060 and U+061C not stripped): low, non-blocking. Cosmetic spoofing of tool name/summary only; the UI renders text through React (escaped) under the CSP, the secret mask and length caps are in place. Add the characters to the class when finding 1 is fixed.",
    "Verified clean: server binds 127.0.0.1 only (server.mjs:20, 264). New routes POST /agents and /agents/:id/stop are in ROUTES with auth token and mutating true, and bridge-auth.test.mjs drives them through the table-driven gate. Body capped at 4 KB before parsing; only ref, role and mode are read from it. ref is anchored regex with no leading dash and no path characters, role and mode are allowlists, the prompt is a fixed template over those fields, so no client string reaches a shell, a path or the prompt. Relay-hop 409 is keyed to the entry (route vs start()), start() is not exposed over HTTP. Reservation is one synchronous step (host.mjs:96-111). Kill order and terminated-only-after-exit as specified; signals go only to processes spawned this run, never to anything read from a file. sessions.jsonl: dir 0700 and file 0600 set explicitly, appends serialised, replay treats the file as untrusted (field-validated, unknown keys dropped, reason sanitised to printable ASCII, nothing signalled). .scratch/_run/ is git-ignored. Process handlers installed only with a runtime and removed in close().",
    "risk-check .claude/** rule (scripts/risk-check.mjs:79-83) is a pure addition that widens security review; no way to weaken an existing rule.",
    "ADR 0016 amendment 4 and the REF_RE \\d{2,} change are the user's merge-time approvals (already listed by qa); the ADR text matches the code."
  ],
  "failures": [],
  "pending": [
    {"item": "Developer follow-up (any time before or after merge, not blocking): escape the bidi characters at host.mjs:27 (findings 1, 4) and add .catch on host.mjs:114 and :134 (finding 2)", "owner": "developer"},
    {"item": "Add to D2 (claude-adapter) ticket as an acceptance criterion: shutdown() bounds its wait on pending spawns and falls back to killAllSync (finding 3)", "owner": "orchestrator"},
    {"item": "User approves ADR 0016 fourth amendment and herald dispatchability at merge", "owner": "user"}
  ]
}
```

## State

Verdict: Security pass. Verdict recorded with `board comment --verdict pass`.

## Findings table

| File:line | Severity | Why |
|---|---|---|
| apps/bridge/cells/host.mjs:27 | low | Literal bidi controls in source (Trojan-Source class); use escapes |
| apps/bridge/cells/host.mjs:113-114 (and 134) | low | Derived promise with no handler; a throwing onChange becomes an uncaughtException and bridge exit |
| apps/bridge/cells/host.mjs:249 | low (medium at D2 if spawn can hang) | shutdown waits unbounded on pending spawns; signal handlers could never exit |
| apps/bridge/cells/host.mjs:25-29 | low | Zero-width characters not stripped; cosmetic spoofing only |

## Secrets and dependencies

gitleaks (at /opt/homebrew/bin/gitleaks, not ~/.local/bin where the genome says it is): `detect --log-opts="origin/main..db9fc50"`, 4 commits scanned, no leaks. No dependency changes, so no npm audit needed.

## Failed calls

- Bash, `~/.local/bin/gitleaks detect ...`: "no such file or directory"; the binary is at /opt/homebrew/bin/gitleaks (on PATH). Used `gitleaks` from PATH. Fixable friction: genome path is stale.
