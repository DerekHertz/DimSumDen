# 18: Board CLI hardening: unknown flags, bad status transitions, handoff-gated release

**Type:** task

**What to build:** Extend the `board` CLI (ADR 0008's module) with three validations, per ADR 0009 decision 2's ranked #1 rule (3 incidents: an unrecognized `--as` flag silently stored as comment text; `qa` set `in-review` during a `specify` claim; a `developer` ended twice without pushing or writing a handoff).

1. **Reject unknown flags.** Every subcommand declares its flag set; an unrecognized flag is a hard error naming the bad flag, never silently consumed as positional/text content.
2. **Reject invalid status transitions for the calling cell's mode.** `board release --status in-review` fails when the calling claim was `qa` in `specify` mode (qa-specify never sets ticket status itself — only a `developer`'s later release does).
3. **`board release --status in-review|resolved` requires a valid State block.** Read the ticket's newest handoff file (`.scratch/<feature>/handoffs/*.md`), parse its leading JSON block, and call `validateState` (`organism-infra/17`). Refuse the release, with the validator's named errors, if it's missing or invalid. `--force --reason "<text>"` bypasses this and appends a `kind:"override"` line to `events.jsonl`.

**Blocked by:** 17 (needs `validateState` to call)

**Status:** in-review

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
