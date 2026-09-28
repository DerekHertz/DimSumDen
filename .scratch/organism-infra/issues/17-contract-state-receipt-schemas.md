# 17: Contract/State/Receipt schema module

**Type:** task

**What to build:** A single small module (e.g. `apps/organism-infra/schemas.mjs`) exporting `validateContract`, `validateState`, `validateReceipt`, one per JSON shape defined in ADR 0009 decisions 3-5. Each validator takes a parsed object and returns `{ok: true}` or `{ok: false, errors: [string]}` — no throwing, so callers (the board CLI, the orchestrator's handback step, CI) can report cleanly. This is the shared seam every other ticket in this batch depends on; it has no behavior of its own beyond shape-checking.

Schemas (see ADR 0009 for the authoritative JSON shape and field meanings):
- Contract: `goal, inputs, output, constraints, done_when`
- State: `ticket, current_step, artifacts, decisions, failures, pending`
- Receipt: `context_sources, policy_version, tools_used, tool_refusals, tests{passed,failed}, retries, human_corrections, tokens, artifact, rollback_point, worktree{path,clean}`

Note the `worktree` field in Receipt is shape-only: this ticket defines its two keys (`path`, `clean`) but does not compute them — `organism-infra/16` owns populating and validating that value.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `validateContract`, `validateState`, `validateReceipt` each reject a missing required key with a named error
- [ ] `validateState` treats a non-empty `pending` array as valid only when the qa/developer relay convention (a named next cell) is followed — document the rule in the module's own doc comment, don't hardcode relay names
- [ ] `validateReceipt` accepts `tool_refusals: []` as valid (an empty list, not a missing key, is the "none" case)
- [ ] Unit tests cover one valid and one invalid case per validator

## Comments

- **Created (architect, 2026-09-28):** Split from `organism-infra/15` per ADR 0009. This is the foundation ticket for 18, 21 and 23 — land it first.
- **qa, 2026-09-28:** qa specify: failing tests on branch claude/organism-infra-17-tests (110dd93). Handoff: .scratch/organism-infra/handoffs/17-qa-specify.md
- **qa, 2026-09-28:** qa specify complete (branch claude/organism-infra-17-tests, 110dd93); developer taking over implementation
- **developer, 2026-09-28:** implemented schemas.mjs, 179/179 full suite, pushed to claude/organism-infra-17-tests at a9c02e4; handoff at .scratch/organism-infra/handoffs/17-developer.md
- **unknown, 2026-09-28:** qa verify: QA pass. 179/179 npm test, schemas.test.mjs unchanged since 110dd93 (empty diff), regression tests for the two pending-item bugs reviewed and non-tautological. Handoff: .scratch/organism-infra/handoffs/17-qa-verify.md. Status left as in-review; next: security.
- **unknown, 2026-09-28:** security: Security pass. Reviewed a9c02e4 vs origin/main: 3 new files, pure shape-validation only (no fs/exec/network), no new dependency, no CI change, no secrets found. Handoff: .scratch/organism-infra/handoffs/17-security.md. Status left as in-review; next: orchestrator proposes merge.
- **Resolved (orchestrator, 2026-09-28):** Merged in PR #23. Worktrees cleaned.
