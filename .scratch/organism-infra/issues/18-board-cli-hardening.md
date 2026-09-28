# 18: Board CLI hardening: unknown flags, bad status transitions, handoff-gated release

**Type:** task

**What to build:** Extend the `board` CLI (ADR 0008's module) with three validations, per ADR 0009 decision 2's ranked #1 rule (3 incidents: an unrecognized `--as` flag silently stored as comment text; `qa` set `in-review` during a `specify` claim; a `developer` ended twice without pushing or writing a handoff).

1. **Reject unknown flags.** Every subcommand declares its flag set; an unrecognized flag is a hard error naming the bad flag, never silently consumed as positional/text content.
2. **Reject invalid status transitions for the calling cell's mode.** `board release --status in-review` fails when the calling claim was `qa` in `specify` mode (qa-specify never sets ticket status itself — only a `developer`'s later release does).
3. **`board release --status in-review|resolved` requires a valid State block.** Read the ticket's newest handoff file (`.scratch/<feature>/handoffs/*.md`), parse its leading JSON block, and call `validateState` (`organism-infra/17`). Refuse the release, with the validator's named errors, if it's missing or invalid. `--force --reason "<text>"` bypasses this and appends a `kind:"override"` line to `events.jsonl`.

**Blocked by:** 17 (needs `validateState` to call)

**Status:** resolved

- [ ] `board <any-subcommand> --bogus-flag` exits non-zero naming the flag, and does not store it as comment/status text (test)
- [ ] `board release <ticket> --status in-review` from a claim held in `qa --mode specify` is rejected (test)
- [ ] `board release <ticket> --status in-review` with no handoff file, or a handoff with no/invalid State block, is rejected with the validator's errors (test)
- [ ] `board release <ticket> --status in-review --force --reason "..."` succeeds and appends a `kind:"override"` line to `events.jsonl` (test)
- [ ] A valid State block with empty `pending` releases normally, no `--force` needed (test)

## Comments

- **Created (architect, 2026-09-28):** Split from `organism-infra/15` per ADR 0009 decision 2 (rule #1) and decision 4. Open question carried from the ADR, not yet answered by the user: should the State-block check in item 3 be this hard block, or warn-and-log without blocking? Implement the hard block as designed unless the user says otherwise before this ticket is claimed.
- **qa, 2026-09-28:** releasing qa-specify claim; developer picking up
- **developer, 2026-09-28:** developer: three validations implemented, pushed, reviewed; qa to verify
- **unknown, 2026-09-28:** qa verify: PASS. board-cli-hardening.test.mjs unchanged since 96656de; developer's edits to board-cli.test.mjs and board-status-and-lock.test.mjs are setup-only (writeValidHandoff calls, no assertions changed). npm test 188/188 pass, organism-infra suite 113/113 pass. All 5 criteria have passing tests. Surveyed all 65 real handoffs: only organism-infra/17 and 18 have a State block -- the other 59 would fail the new gate, confirming the handoff skill doesn't emit it yet. See .scratch/organism-infra/handoffs/18-qa-verify.md.
- **unknown, 2026-09-28:** security: BOUNCE. Two HIGH findings: (1) board-service.mjs validateHandoffState/validateState never bind the checked handoff to the ticket being released -- newest-by-mtime across the whole feature handoffs dir, no state.ticket match, and this repo per-cell git worktrees reset mtimes on checkout, so the gate can pass silently (no --force, no override event) using an unrelated or stale handoff; confirmed by the branch's own criterion-3 test, which never asserts on a mismatched state.ticket. (2) the qa-specify transition block only fires on the exact self-reported cell=qa and mode=specify; --mode is optional free text with no allow-list, so a qa claim made without --mode (or with any other string) sails through release --status in-review, reproducing the exact incident this ticket was meant to close. Path traversal, symlinks, JSON parsing, and events.jsonl escaping of --force --reason all checked clean; no new dependency, no secrets found. Details: .scratch/organism-infra/handoffs/18-security.md
- **unknown, 2026-09-28:** fix-1: bind handoff to ticket being released; qa --mode required/allow-listed and verify-only release to in-review; --reason can no longer swallow --force
- **unknown, 2026-09-28:** qa verify (fix-1, fbee4e7): PASS. Both HIGH findings fixed and covered by board-cli-hardening.fix1.test.mjs (handoff-to-ticket binding, qa --mode allow-list/required). board-cli-hardening.test.mjs unchanged since 96656de. board-cli.test.mjs and board-status-and-lock.test.mjs edits are setup-only (--mode verify added, per-ticket handoff loop), no assertion weakened. npm test 200/200 pass. See .scratch/organism-infra/handoffs/18-qa-verify-2.md.
- **unknown, 2026-09-28:** security re-review (fbee4e7): PASS. Both HIGH findings closed -- validateHandoffState now binds the handoff to the ticket being released (NN-prefix filename filter + State.ticket full/short-form match), and qa --mode is required and allow-listed (specify|verify) with release-to-in-review gated on mode===verify, still outside the --force branch. Regression tests in board-cli-hardening.fix1.test.mjs cover both. npm test 200/200 (ran myself). No new dependency, no secrets, no CI changes. One non-blocking, pre-existing gap noted (not a new bypass, not flagged as HIGH before either): the qa-mode transition guard only checks newStatus===in-review, not resolved, so a qa claim could still self-release to resolved with a valid handoff -- recommend a follow-up ticket. See .scratch/organism-infra/handoffs/18-security-2.md
- **Resolved (orchestrator, 2026-09-28):** Merged in PR #24. Worktrees cleaned.
