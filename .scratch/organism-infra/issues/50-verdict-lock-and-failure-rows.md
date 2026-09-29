# 50: Verdict needs a claim lock; log-cell failure rows; usage-append fixes

**Type:** feature

**What to build:**
- **Verdict needs the lock (user decision, 2026-09-29):** `board comment --verdict` is refused unless the author holds that ticket's claim lock, with no exemption for the orchestrator. The author's cell (and mode, for qa) must match the lock. A comment without `--verdict` keeps today's rules. Update the existing no-lock `--as` verdict tests. From 49's security review, and a qa cell that posted a verdict without claiming.
- **`log-cell --failures`:** `scripts/log-cell.mjs` takes an optional `--failures "<tool>:<what>;<tool>:<what>"`. It writes one `{"kind":"incident","ts","ticket","cell","tool","what","cost":null,"fix":null,"rule_change":null,"source":"cell-report"}` row per item after the cell row. `tool` must be one of a fixed list exported from the script: `bash-guard`, `board-claim`, `board-release`, `board-comment`, `board-handoff`, `handoff-state`, `git`, `npm`, `write`, `ci`, `other`. An unknown tool, an empty `what`, or `what` over 300 characters is refused, and nothing is written, not even the cell row.
- **`log-cell` symlinked `.scratch` (LOW):** run the same realpath containment check as `log-resolved`.
- **`log-resolved` race (LOW):** do the duplicate check and the append under the board write lock.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] `--verdict` without the matching claim lock is refused, including for the orchestrator (tests)
- [ ] `log-cell --failures` writes one incident row per item, and bad input writes nothing (tests)
- [ ] `log-cell` refuses a symlinked `.scratch` directory (test)
- [ ] Two concurrent `log-resolved` runs write exactly one row (test)
- [ ] ADR 0008 updated

## Comments

- **Created (orchestrator, 2026-09-29):** From 49's security review, with the user's verdict-lock decision (no orchestrator exemption) and the pipeline-retro plan.
- **qa, 2026-09-29:** QA pass: 382/382, qa tests unchanged since 5e46213, --failures validated before any write. See 50-qa-verify.md.
- **security, 2026-09-29:** Security pass on c031b54. No critical/high/medium. Low: verdict lock is discipline not auth (board-service.mjs:1148); symlink check is last-component lstat then open (log-cell.mjs:64); no cap on --failures item count (log-cell.mjs:39); pre-existing: release at resolved has no dup-row check (board-service.mjs:1011). gitleaks clean. See handoff 50-security.md.
- **orchestrator, 2026-09-29:** PR #39 merged
