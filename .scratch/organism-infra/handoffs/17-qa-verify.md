## State
```json
{"ticket": "organism-infra/17", "current_step": "qa verify complete: pass",
 "artifacts": ["apps/organism-infra/schemas.mjs", "apps/organism-infra/schemas.test.mjs", "apps/organism-infra/schemas.regression.test.mjs"],
 "decisions": [
   "full verify (qa wrote the tests at 110dd93; still ran the complete checklist since a developer round intervened)",
   "confirmed schemas.test.mjs byte-identical between 110dd93 and a9c02e4 (empty git diff)",
   "reviewed the two new regression tests (missing item.item, non-array pending) as non-tautological: fixtures are independent literals, assertions check error messages name the right field"
 ],
 "failures": [],
 "pending": [{"item": "security review of the branch", "owner": "security"}]}
```

**Verdict: QA pass.**

**Checked out:** SHA `a9c02e4` (origin/claude/organism-infra-17-tests), detached, in worktree `C:\claude_sessions\agent_office\.claude\worktrees\agent-aca3ff881eadc2066`. Worktree is clean (`git status --short` empty), no local changes made.

**Evidence:**
- `npm test` -> 179/179 pass, 0 failed, 0 skipped (`apps/organism-infra/schemas.mjs`, `schemas.test.mjs`, `schemas.regression.test.mjs` all included in the full run).
- `git diff 110dd93 a9c02e4 -- apps/organism-infra/schemas.test.mjs` is empty: qa's tests are unchanged, none weakened.
- Acceptance criteria mapped to passing tests in `schemas.test.mjs`:
  - "each validator rejects a missing required key with a named error" -> `schemas.test.mjs:71,90,108,124` (per-key loops for Contract/State/Receipt top-level and Receipt's nested `tests`/`worktree`).
  - "validateState treats a non-empty pending array as valid only when the relay convention (named next cell) is followed" -> `schemas.test.mjs:164,174,185,196` (accepts named owner; rejects bare string, empty owner, missing owner).
  - "validateReceipt accepts tool_refusals: [] as valid" -> `schemas.test.mjs:138`.
  - "unit tests cover one valid and one invalid case per validator" -> `schemas.test.mjs:65,84,102` (valid) plus the per-key rejection loops (invalid).
  - No malformed-input crash (the ticket's "no throwing" requirement) -> `schemas.test.mjs:216,224,232`.
- No unscoped Comments items on this ticket beyond the checkbox criteria; nothing to mark `human-verified`.
- Developer's regression tests (`schemas.regression.test.mjs`) reviewed:
  - Bug (a), `{owner: "developer"}` with no `item` text, and an empty-string `item` -- both correctly rejected, error messages reference "pending"/"owner" (`schemas.mjs:78-82`).
  - Bug (b), `pending` present but not an array (string, then a bare object) -- both correctly rejected with an error naming `"pending"` (`schemas.mjs:68-69`).
  - Assertions check `result.ok === false` and error-message content against independently-written fixtures, not a copy of the implementation's own logic -- not tautological.

**Handoff path:** `.scratch/organism-infra/handoffs/17-qa-verify.md` (this file), written to the main checkout only.

**Worktree:** `C:\claude_sessions\agent_office\.claude\worktrees\agent-aca3ff881eadc2066`, clean.

**Refusals:** none.

**Next step:** security review, then orchestrator proposes merge. Status left as `in-review` per the relay convention (qa does not set ticket status).

## Tool refusals
None.
