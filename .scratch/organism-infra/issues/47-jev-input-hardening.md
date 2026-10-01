# 47: Harden jev-report input handling; jev.mjs rejects unknown tickets

**Type:** task

**Priority:** P2

**What to build:** From 41's security review (all LOW) and a session-8 incident. In `scripts/jev-report.mjs`:
- Skip a valid-JSON line that is not an object, such as `null`, instead of throwing (~line 32).
- Look up `pick` weights with `Object.hasOwn`, so values like `constructor` or `toString` can't produce NaN (~56-57).
- Restrict the ticket-key regex to `[\w.-]+` segments, so control characters and `|` can't reach the output or break the `split("|")` join (~12-15, 103-119).

In `scripts/jev.mjs`, exit non-zero with a clear message when `--ticket` names no issue file on the board, and write no row. On 2026-09-28 a mistyped ref (`organism-infra/41-jev-report`) was accepted and logged.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] A `null` line, a `constructor` pick, and a ticket key with a control character or `|` are handled without a throw, NaN, or raw output (tests)
- [ ] `jev.mjs` with an unknown ticket exits non-zero and appends no row (test)

## Comments

- **Created (orchestrator, 2026-09-28):** From 41's security review, published with the user's yes.
- **orchestrator, 2026-09-30:** Batch B: 47 + 68 criterion 2 (jev-report supports tier/verify verdict without hand computation) + security Lows in the comments on 70, 72 (ticketTextOf path normalization) and 80 (both jg.mjs Lows). One relay, one PR.
- **qa, 2026-09-30:** qa specify: 25 failing tests on tests/batch-B @ 77ea34b (14 in jev-hardening.test.mjs, 11 in jev-report-exit-criteria.test.mjs). Maps: 47/1 (null, constructor NaN, | key), 47/2 (unknown ticket exits non-zero/no row), Low-70 (empty bounceComment), Low-72 (newInputs path traversal), Low-80 (jg checkout boundary), 68/2 (checks + safetyBounces + PASS/FAIL). Handoff: 47-qa-specify.md.
- **developer, 2026-09-30:** developer
- **qa, 2026-09-30:** QA pass. 1274/1274 tests pass (0 skip). QA test files jev-hardening.test.mjs and jev-report-exit-criteria.test.mjs are byte-for-byte identical to specify commit 77ea34b. All 14 testable criteria covered by passing tests; Low-80-2 human-verified. Files outside qa test files touched by diff: jev-report.mjs, jev.mjs, jev-wake-prelude.mjs, jg.mjs (all in scope), jg.test.mjs and jg-wrapper.test.mjs (setup-only, assertions intact). jg test setup change acceptable — see handoff 47-qa-verify.md.
- **security, 2026-09-30:** Security pass. gitleaks: no leaks (3 commits, 29 KB). npm audit: 0 vulns. No new deps, no CI changes. Three risk-check hits all low/false-positive: (1) jev-hardening.test.mjs:24 sk- prefix is a synthetic test constant, not a credential; (2) spawnSync uses process.execPath with TYPESAFE_API_KEY='', safe test technique; (3) board/lock code changes are hardening (path traversal filter, .git ancestor check, Object.hasOwn, existsSync). No critical or high findings.
