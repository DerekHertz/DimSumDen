## State
```json
{"ticket": "organism-infra/17", "current_step": "developer implementation complete, pushed",
 "artifacts": ["apps/organism-infra/schemas.mjs", "apps/organism-infra/schemas.regression.test.mjs"],
 "decisions": [
   "followed qa's {item, owner} pending shape as-is, no divergence, no question raised",
   "no reclaim subcommand exists on board CLI (claim/release/status/comment/list only); took the ticket over by releasing qa's stale claim to ready-for-agent then claiming as developer",
   "kept qa's schemas.test.mjs untouched; two regression-review bugs fixed in schemas.mjs got their own new test file, schemas.regression.test.mjs, rather than edits to qa's tests"
 ],
 "failures": [],
 "pending": [{"item": "verify the branch (schemas.mjs + both test files) against the ticket's acceptance criteria and scope", "owner": "qa"}]}
```

**State**: done (implement). Branch `claude/organism-infra-17-tests` pushed fast-forward, `110dd93..a9c02e4`.

**What changed**: Added `apps/organism-infra/schemas.mjs` implementing `validateContract`, `validateState`, `validateReceipt` per ADR 0009 decisions 3-5, making all 50 of qa's tests in `schemas.test.mjs` pass without editing that file. A code-review pass then found two bugs in the first version of `validateState`'s pending-item check:
- (a) `hasNamedOwner` checked only `item.owner`, so `{owner: "developer"}` (no `item` text) passed incorrectly.
- (b) a `pending` value that was present but not an array (a string or object) skipped the shape check entirely instead of reporting an error naming `pending`.

Both are fixed in `schemas.mjs`, with four new regression tests in `apps/organism-infra/schemas.regression.test.mjs` (a separate file -- qa's `schemas.test.mjs` was never touched).

**Test results**: `node --test apps/organism-infra/schemas.test.mjs apps/organism-infra/schemas.regression.test.mjs` -> 54/54 pass. Full suite `npm test` -> 179/179 pass.

**Commits**: `c8facd1` (initial implementation, 50/50 on qa's tests), `a9c02e4` (fixes + regression tests, 179/179 full suite). Pushed to `origin/claude/organism-infra-17-tests` fast-forward.

**Code review**: The Standards-axis sub-agent returned (no `CODING_STANDARDS.md`/`CONTRIBUTING.md` exists in this repo, so only the Fowler smell baseline applied): two minor, non-blocking "Duplicated Code" judgement calls -- the three validators share an identical guard-clause/return wrapper shape, and `validateReceipt`'s two nested-object checks (`tests`, `worktree`) are structurally identical with only the field name swapped. Neither was treated as blocking; left as-is since the ticket doesn't ask for a shared-shape refactor and the duplication is small (three call sites, two call sites).

The Spec-axis sub-agent's own run was lost to a background-agent session boundary before I could read its output directly; the orchestrator relayed its two findings to me instead (both are the (a)/(b) bugs above, now fixed). I have not independently re-run a Spec-axis review after the fix -- noting this so qa/security know the Spec review is relayed secondhand, not a document I read myself.

**Decisions made**: Followed qa's `{item, owner}` pending shape as specified; no open question to raise. Also required `item.item` to be a non-empty string alongside `owner` (this was implicit in qa's own valid-pending test fixtures, e.g. `{item: "verify the branch", owner: "qa"}`, but the original code never enforced it -- now it does).

**Next step**: qa verifies this branch against the ticket's acceptance criteria (including the two regression cases), then security review, then the orchestrator proposes the merge.

**Suggested skills**: `tdd`, `organism-protocol`.

**Gotchas**: `Receipt.worktree` is still shape-only (organism-infra/16 computes real `path`/`clean` values) -- unchanged from qa's original scope note. The two Standards-review "Duplicated Code" notes are safe to pick up in a later cleanup pass if the orchestrator or a future ticket wants it; not addressed here since they're outside this ticket's acceptance criteria.

## Tool refusals
None with lasting effect. Several consecutive Bash and Agent tool calls failed transiently with "server-side auto mode classifier gave no verdict (error)" (affecting plain `git status`/`git add` and two background code-review Agent spawns) before recovering on retry with no workaround applied. One of the two background code-review agents (Spec axis) was lost to a session/turn boundary before its result could be read directly; its findings were relayed by the orchestrator instead (see Code review above).
