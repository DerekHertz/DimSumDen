# 208 qa specify

Branch `tests/208-cell-context-hook`, commit 83d3e27 (base 17b3267). Test file: `scripts/hooks/context-budget.208.test.mjs` (13 tests: 4 fail, 9 pass as guards).

## Key finding: most of 208 already exists

The PreToolUse hook the ticket describes was built and registered by 162 / 145 / 165 / 194: `scripts/hooks/context-budget.mjs`, wired in `.claude/settings.json` (cb286b4), with 5 test files (about 100 tests). It already refuses Read, Edit, Write (outside the allowed paths) and Bash at the stop limit, allows git add/commit, board handoff|release|comment, `context.mjs`, SubagentHandback, and Write/Edit under main-checkout `.scratch/` and the session scratchpad. It never gates the orchestrator and fails open on no reading. The `.claude/settings.json` entry is already there, so AC6 may need no diff at all.

I wrote tests only for the real gaps:

1. The 70k-80k warning is not one-time. Today it repeats on every call in the window.
2. `node scripts/log-cell.mjs` is not a wrap-up command (refused at 95k).
3. Write/Edit to a plain `/tmp/...` path is refused. Only the session scratchpad and `.scratch/` pass. The ticket says Write is refused "outside /tmp".

## Criterion-to-test map

- AC1 refusal of Edit, Write outside /tmp, Read, Bash plus message: existing `context-budget.test.mjs` ("at exactly 80k ... Read", "... Grep, a Glob and a non-wrap-up Bash", "the refusal message says how to wrap up", "... Write or Edit outside .scratch/"); new boundary tests in the 208 file ("a Write outside /tmp is refused", ".. climbs out of /tmp", "Read of a /tmp file is still refused").
- AC2 wrap-up still runs: existing WRAP_UP table; new "log-cell.mjs is allowed" (FAILS), "log-cell chained ... refused", "other scripts refused", "Write or Edit ... under /tmp is allowed" (FAILS).
- AC3 one warning at 70-80k, not refused: new "first call warns, second silent" (FAILS), "not re-sent when context grows" (FAILS), "still refused once it crosses 80k", "each cell gets its own warning", "warning comes at 70k after silent calls". Warning text itself: existing tests.
- AC4 orchestrator never refused: existing "orchestrator ..." tests and `context-budget.handback.test.mjs`.
- AC5 fails open: existing "null context ..." and "unreadable or empty hook input" tests, and the session_id hardening test.
- AC6 settings.json diff in developer handoff: human-verified.
- AC7 `npm test` green: the whole suite.

The tests use a fresh session id each, so the developer may keep "already warned" state anywhere keyed by session (and agent) without cross-test leakage. The hook must still pick a state location that works under the test's HOME fixture or `os.tmpdir()`.

## Questions for the orchestrator

- Thresholds: the ticket says 70k warn / 80k stop for every cell, but `scripts/context-budget.json` (145) sets developer and qa to 100k / 120k. The tiers tests pin that. I did not touch it. Seven "past 80k" incidents may be partly that config, since den-v1/07's developer at about 110k is under its 120k stop. If the user wants 80k for developer/qa, that is a config and test change (145 tiers tests), not a hook change. Needs a scope decision.
- Live firing: 162 security left "user confirms the hook fires in a real cell" open. If cells still run far past their stop, the cause may be that the hook fails open in practice (for example `context.mjs --self` returning null because the transcript cwd does not match the hook's cwd). Unit tests cannot show that. Worth one live check before more code.

## State

```json
{
  "ticket": "organism-infra/208-cell-context-hook",
  "cell": "qa",
  "mode": "specify",
  "current_step": "tests committed at 83d3e27; 4 fail for missing features, 9 pass as guards",
  "artifacts": [
    {"path": "scripts/hooks/context-budget.208.test.mjs", "note": "13 tests, tests/208-cell-context-hook"}
  ],
  "decisions": [
    {"decision": "tests only for the three gaps; the rest of 208 is covered by 162/145/165/194 tests", "why": "the hook and settings.json registration already exist"},
    {"decision": "AC6 marked human-verified", "why": ".claude/ is user-gated, and the entry may already be in place"},
    {"decision": "did not change the 100k/120k developer and qa tiers", "why": "scope question for the orchestrator and user"}
  ],
  "failures": [],
  "pending": [
    {"item": "Decide thresholds for developer/qa (80k per ticket vs 100k/120k in config), and whether to confirm the hook fires live", "owner": "orchestrator"},
    {"item": "Make the 4 failing tests pass in scripts/hooks/context-budget.mjs: one-time warning state, log-cell in WRAP_UP_BASH, /tmp Write/Edit; give any settings.json diff in the handoff", "owner": "developer"}
  ]
}
```
