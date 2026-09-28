## State
```json
{"ticket": "organism-infra/18", "current_step": "security review complete: manual diff review against origin/main, verdict bounce",
 "artifacts": [
   "apps/organism-infra/board.mjs",
   "apps/organism-infra/board-service.mjs",
   "apps/organism-infra/board-fixture.mjs",
   "apps/organism-infra/board-cli.test.mjs",
   "apps/organism-infra/board-status-and-lock.test.mjs",
   "apps/organism-infra/board-cli-hardening.test.mjs"
 ],
 "decisions": [
   "checked out 008fb3d (origin/claude/organism-infra-18-tests) in worktree C:\\claude_sessions\\agent_office\\.claude\\worktrees\\agent-a9a866767ff0dd6c2 and diffed against origin/main",
   "traced the handoff-gate read path: parseTicketRef enforces FEATURE_RE=/^[a-z0-9-]+$/ and TICKET_RE, so the feature segment cannot path-traverse (no dot/slash characters admitted)",
   "confirmed readdir(..., {withFileTypes:true}).filter(e.isFile()) excludes symlinked entries (Node reports DT_LNK via isSymbolicLink(), not isFile()), so a symlink planted in a handoffs dir is not picked up -- no traversal-via-symlink path",
   "found validateHandoffState(root, feature) in board-service.mjs never receives or checks the ticket being released: it picks the newest-by-mtime *.md across the whole feature handoffs dir and validates only that the State block is structurally well-formed -- validateState in schemas.mjs likewise never compares state.ticket to the ref",
   "confirmed via board-cli-hardening.test.mjs criterion-3 test (missing-required-field case) that the test fixture sample State block uses ticket: sample/01-do-thing while releasing a differently-named fixture ticket, and this mismatch is never asserted on -- the suite itself has no ticket-binding coverage, consistent with the code not checking it",
   "this project runs every cell in a fresh git worktree; git checkout resets file mtimes to checkout time, so newest by mtime is not a stable proxy for most recently authored inside this system's own workflow, compounding the missing ticket-binding check",
   "checked JSON parsing: JSON.parse(match[1]) is wrapped in try/catch, no eval, and validateState only reads plain-object fields (isPlainObject/array checks) -- no prototype-pollution or injection path from untrusted handoff text",
   "checked --force --reason: reason lands in events.jsonl via JSON.stringify(full) in appendEventLocked, which safely escapes newlines/quotes into a single JSON line -- no events.jsonl injection. reason is also appended raw into the ticket markdown body (- **cell, date:** reason), but that concatenation already existed on main before this ticket and readStatus/replaceStatus only match a status line before the first ## heading, so injected markdown in a Comments-section reason cannot spoof the ticket Status line -- pre-existing, low severity, not this ticket regression",
   "checked the qa-specify transition block (item 2): claim() --mode is free text (only checkArgLength, no allow-list) and fully optional; release() block only fires when cell===qa && mode===specify exactly. A qa cell that claims without --mode, or with any other mode string, is not blocked from release --status in-review -- reproduces the exact incident (qa set in-review during a specify claim) this ticket exists to close, without any code change needed to trigger it",
   "confirmed no new/changed dependency, no lockfile change, and grepped the branch 3 commits diff for key/token/secret/password/BEGIN patterns -- no hits",
   "parseFlags non-boolean flag consumes the next token unconditionally (e.g. --reason --force sets reason to the literal string --force and swallows the force flag) -- a usability foot-gun, not a security bypass in the dangerous direction (it only ever disables --force, never enables it unasked); noting but not blocking on it"
 ],
 "failures": [],
 "pending": [
   {"item": "bind the handoff-state check to the ticket being released: either require the newest handoff filename to be ticket-prefixed and select by that instead of raw mtime, or check state.ticket equals ref (or feature/ticket) inside validateHandoffState/validateState and refuse if it does not match", "owner": "developer"},
   {"item": "stop relying on mtime as newest: pick a signal that survives git checkout in a fresh worktree (e.g. filename ordering/sequence number, or a monotonic marker written by the handoff skill itself)", "owner": "developer"},
   {"item": "close the qa-specify bypass at the protocol layer: either make --mode required (with an allow-list of known modes) on a qa claim, or have release transition check treat a qa claim with no mode as untrusted-for-in-review by default rather than only blocking the one exact string specify", "owner": "developer"},
   {"item": "orchestrator per qa earlier handoff: decide whether ADR 0009 commit and the handoff skill default State-block emission still need doing before this ticket gate goes live repo-wide", "owner": "orchestrator"}
 ]}
```

## Verdict: Security bounce

**Branch/commit:** `008fb3d` (`origin/claude/organism-infra-18-tests`), checked out in worktree `C:\claude_sessions\agent_office\.claude\worktrees\agent-a9a866767ff0dd6c2`. Diffed against `origin/main` (440 insertions / 25 deletions across board.mjs, board-service.mjs, board-fixture.mjs, and 3 test files).

### Findings

- **HIGH -- `apps/organism-infra/board-service.mjs:583-608` (`validateHandoffState`), reinforced by `schemas.mjs:61-88` (`validateState`): the handoff-gate check is not bound to the ticket being released.** It selects the newest `*.md` by mtime across the whole feature handoffs directory, and `validateState` only checks the State block's own shape -- neither ever compares `state.ticket` to the ref actually being released. Any cell releasing any ticket in a feature can satisfy the item-3 gate using an unrelated (or stale) ticket handoff. Worse, every cell here runs in a fresh git worktree, and `git checkout` resets file mtimes to checkout time, so "newest by mtime" is not a stable signal for "most recently authored" in this project's own workflow -- a routine checkout can make an old, irrelevant handoff look newest. This defeats the acceptance criterion (read the ticket's newest handoff file, refuse the release if it is missing or invalid) and, because the bypass is silent (no `--force`, no `kind:"override"` line), it also breaks the audit trail item 4 depends on. Confirmed independently by the branch's own `board-cli-hardening.test.mjs` criterion-3 test, whose fixture State block carries a mismatched `ticket: sample/01-do-thing` and is still accepted -- there is no test covering ticket-binding because the code does not do it.
- **HIGH -- `apps/organism-infra/board-service.mjs:696-706` (the qa-specify transition block) and `board.mjs` claim handling of `--mode`: the block that item 2 exists to add is opt-in and self-reported.** `--mode` is free text, unvalidated against an allow-list, and fully optional. The block only fires on the exact match `cell === qa && mode === specify`. A qa cell that claims without passing `--mode specify` (or passes any other string) is never blocked from `release --status in-review` -- which reproduces, byte for byte, the incident (qa set in-review during a specify claim) this ticket was written to close. No adversarial input is needed, just the same omission that caused the original incident.

### Not a blocker (verified clean)
- Path traversal via the feature ref: `FEATURE_RE = /^[a-z0-9-]+$/` and `TICKET_RE` in `parseTicketRef` reject anything with dot/slash characters before any path is built.
- Symlinks: `readdir(..., {withFileTypes:true})` entries are filtered by `e.isFile()`, which is false for a symlink dirent (`isSymbolicLink()` is the true one) -- a planted symlink is never selected.
- JSON parsing of untrusted handoff text: `JSON.parse` in a try/catch, no eval, `validateState` only does plain-object/array shape checks -- no prototype pollution or code-injection path found.
- `events.jsonl` write of `--force --reason` text: goes through `JSON.stringify(full)` in `appendEventLocked`, which escapes newlines/quotes into one JSON line -- no injection into the event log.
- No new/changed dependency, no lockfile change; no secret/key/token/password pattern found across the branch's 3 commits.

### Low / non-blocking (left in Comments only)
- `reason` is appended raw into the ticket markdown body (pre-existing on `main`, not this ticket's regression); `readStatus`/`replaceStatus` only match a status line before the first `## ` heading, so this cannot spoof the `Status:` field, but arbitrary markdown in a comment is still unsanitized.
- `parseFlags` non-boolean flags unconditionally consume the next token, so `--reason --force` silently eats `--force` as the reason value instead of erroring -- a usability foot-gun, not a security hole (it can only disable `--force`, never enable it unasked).

**Refusals:** none.

**Next step:** developer addresses the two HIGH findings (ticket-to-handoff binding and a non-bypassable qa-specify signal), then qa re-verifies, then security re-reviews before this goes back to the orchestrator.
