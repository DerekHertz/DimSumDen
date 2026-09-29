# 22: CI gate: a PR touching .claude/ needs a human approval marker

**Type:** task

**Priority:** P2

**What to build:** Per ADR 0009 decision 2's ranked #5 rule, add a CI check that fails a PR whose diff touches `.claude/**` unless the PR carries a required label (e.g. `human-approved-claude-dir`) that only a human applies — a cell's `gh` usage should not be able to satisfy this itself. This mechanizes the existing brain gate ("only the orchestrator edits `.claude/`, and only with the user's permission") which today has no check behind it; no incident has hit this yet, but it's the hardest of the five ranked rules to notice or reverse if it's ever skipped.

Override: the human applies the label after reviewing the diff — this is not a bypass, it's the gate's normal "yes."

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A PR touching a file under `.claude/` without the approval label fails the check, naming the changed `.claude/` paths (test)
- [ ] The same PR passes once the label is applied (test)
- [ ] A PR that doesn't touch `.claude/` is unaffected regardless of labels (test)
- [ ] `security`'s CI/branch-protection ownership (per its genome) is updated to require this check on the relevant branch protection rule

## Comments

- **Created (architect, 2026-09-28):** Split from `organism-infra/15` per ADR 0009 decision 2. Included on cost/hard-to-reverse grounds (ADR criteria), not incident count — 0 logged incidents in `usage.jsonl` so far.
