## State
```json
{"ticket": "organism-infra/18", "current_step": "qa specify complete: failing tests committed and pushed",
 "artifacts": ["apps/organism-infra/board-cli-hardening.test.mjs"],
 "decisions": [
   "pinned `board claim <ref> <cell> --mode <specify|verify>` as the new declared flag recording a claim's mode, since the ticket names the behavior (qa-specify vs qa-verify vs plain claim) but not the wire shape",
   "pinned a handoff's State block as the first fenced json code block in the newest .scratch/<feature>/handoffs/*.md file (newest by mtime), matching decision 4 of ADR 0009",
   "did not implement claim's --mode flag, release's transition/handoff checks, or the override-event write -- qa never writes product code; all new-behavior tests fail on the CLI silently accepting what should be rejected, not on a syntax/setup error"
 ],
 "failures": [],
 "pending": [{"item": "implement --mode on claim, the qa-specify/in-review transition block, the handoff State-block gate on release --status in-review|resolved, and the --force --reason override (kind:\"override\" event) in board.mjs/board-service.mjs", "owner": "developer"}]}
```

**State**: done (specify). Branch `claude/organism-infra-18-tests` pushed, commit `96656de`.

**What changed**: Added `apps/organism-infra/board-cli-hardening.test.mjs` only, no product code. `node --test apps/organism-infra/board-cli-hardening.test.mjs` currently reports 8 failing / 1 passing (9 total).

**Criterion -> test map** (ticket's 5 checkboxes)
1. "`board <any-subcommand> --bogus-flag` exits non-zero naming the flag, never stored as text" -> 4 new tests here (`claim`, `release`, `list`, `status`); `comment` is already covered by `board-comment-hardening.test.mjs` (ticket 12), not duplicated. All 4 currently fail: exit code 0 where non-zero expected -- the flag is silently ignored today, not rejected.
2. "`release --status in-review` rejected when the claim was `qa --mode specify`" -> 1 test: claims as `qa --mode specify` with a valid handoff present (to isolate this from criterion 3's gate), then asserts the release is rejected and the ticket untouched. Fails today (exit 0) since neither `--mode` nor the transition check exist yet.
3. "`release --status in-review|resolved` requires a valid State block" -> 2 tests: no handoff file at all, and a handoff whose State block is missing required fields (`failures`, `pending`). Both fail today (exit 0, release always succeeds) since the handoff gate doesn't exist yet. The invalid-block test also asserts stderr surfaces validateState's own wording (matching /pending/) once implemented.
4. "`--force --reason` succeeds and appends a `kind:"override"` line to `events.jsonl`" -> 1 test: release with a missing handoff plus `--force --reason "..."` should still succeed (this already happens, since there's no gate yet) but must also log a `kind:"override"` event with the given reason. Fails today: the release succeeds but no override event is written (events.jsonl has only the ordinary `claim`/`release` lines).
5. "a valid State block with empty pending releases normally, no --force needed" -> 1 test: passes today already, since a valid-handoff release is exactly today's unconditional-success behavior. This stays green through and after the developer's change as a regression guard against an overzealous gate.

All 8 failing tests fail for the right reason (missing feature: an unknown flag or bad transition wrongly accepted, a missing/invalid handoff wrongly ignored, no override event logged) -- none fail on ENOENT, import errors, or a thrown exception.

**Decisions made / open design points for the developer to confirm or override:**
- `--mode` on `claim`: chosen shape is `board claim <ref> <cellType> --mode <specify|verify>`. If the developer picks a different flag name or storage format for the claim lock (e.g. encoding mode into the lock's first line differently), that's fine as long as `release`'s transition check keys off the same claiming cell + mode pair my tests exercise -- flag it in the developer's handoff if diverging.
- Handoff State-block location: "first fenced json block in the newest `.scratch/<feature>/handoffs/*.md` file by mtime." The ticket says "the ticket's newest handoff file" without specifying the tie-break; I used mtime since that's the only ordering signal available without a naming convention across the existing handoffs directory (files are numbered by ticket, not always monotonic across a feature).
- I did not test qa-verify-mode releasing at in-review, or a "release with no status change" path for qa-specify to drop its claim lock without touching ticket status -- see open questions below.

**Open questions (out of scope for this ticket's checkboxes, not tested):**
1. **Comments show author "unknown"** (`.scratch/usage.jsonl` incident candidate) -- `board-service.mjs`'s `comment()`/`release()` fall back to `cell = "unknown"` when no claim lock exists at comment/release time. Ticket 18 has no checkbox or Comments-scope item covering this; it's not one of the three validations the ticket names. Left untested; recommend a follow-up ticket if the user wants it fixed.
2. **No `reclaim` subcommand** -- also not named by ticket 18's checkboxes or Comments (the ticket only extends `claim`/`release`'s validation, not the command set). The existing stale-lock reclaim logic in `board-service.mjs` runs automatically inside `claim`/`release`/`comment`, with no CLI-level `reclaim` entry point. Left untested; recommend a follow-up ticket if the user wants an explicit subcommand.
3. **"qa specify can't release without setting a status"** -- related to but distinct from criterion 2. Criterion 2 only blocks qa-specify from setting `in-review`; it doesn't add a way for qa-specify to end its claim without changing ticket status at all (organism-protocol says qa-specify "never sets ticket status itself"). Today, `release` always requires a value from `STATUSES`, so the closest existing workaround is `release --status claimed` (a no-op status change that still drops the claim lock) -- but that already works with unmodified `release()` and isn't part of this ticket's scope. Left untested since the ticket doesn't specify the resolution shape (no-op status, a new "no status change" flag, or a separate unclaim command); recommend the user/architect pick one before a follow-up ticket.

**Next step**: developer implements the three validations in `board.mjs`/`board-service.mjs` against this branch's tests (blocked by `organism-infra/17`, already resolved -- `validateState` is available in `apps/organism-infra/schemas.mjs`).

**Suggested skills**: `tdd`, `organism-protocol`.

**Gotchas**: `release()`'s handoff gate must only apply to `--status in-review|resolved` (per the ticket) -- my tests don't cover `--status blocked`/`claimed`/`ready-for-human`, which should remain ungated. The override event's exact shape beyond `kind:"override"` and a `reason` field carrying the given text is not pinned by my tests; add whatever else `events.jsonl`'s existing `commitWithEvent` shape needs (`feature`, `ticket`, `cell`, `op`, etc.) consistently with the other event kinds already written by `claim`/`release`.
