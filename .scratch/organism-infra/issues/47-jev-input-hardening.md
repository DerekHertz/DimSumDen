# 47: Harden jev-report input handling; jev.mjs rejects unknown tickets

**Type:** task

**Priority:** P2

**What to build:** From 41's security review (all LOW) and a session-8 incident. In `scripts/jev-report.mjs`:
- Skip a valid-JSON line that is not an object, such as `null`, instead of throwing (~line 32).
- Look up `pick` weights with `Object.hasOwn`, so values like `constructor` or `toString` can't produce NaN (~56-57).
- Restrict the ticket-key regex to `[\w.-]+` segments, so control characters and `|` can't reach the output or break the `split("|")` join (~12-15, 103-119).

In `scripts/jev.mjs`, exit non-zero with a clear message when `--ticket` names no issue file on the board, and write no row. On 2026-09-28 a mistyped ref (`organism-infra/41-jev-report`) was accepted and logged.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A `null` line, a `constructor` pick, and a ticket key with a control character or `|` are handled without a throw, NaN, or raw output (tests)
- [ ] `jev.mjs` with an unknown ticket exits non-zero and appends no row (test)

## Comments

- **Created (orchestrator, 2026-09-28):** From 41's security review, published with the user's yes.
