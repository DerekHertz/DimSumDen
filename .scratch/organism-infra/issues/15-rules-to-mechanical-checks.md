# 15: Design question: encode our most-skipped rules as mechanical checks

**Type:** design-question

**What to build:** Most organism rules are prose that the model enforces on itself: brain gates, usage % in every proposal, timeouts, scope in ticket Comments, the relay order. The `incident` lines in `.scratch/usage.jsonl` show those rules being skipped.

Following "encode the rule twice" (guide + check), pick the 3-5 rules with the most incidents or the highest cost, and design a check for each that the agent can't bypass. Also extend the `cell` log line into a change receipt.

Candidate checks (starting points, not decisions):
- A PreToolUse hook on `Agent` and on `gh pr merge` that blocks unless `.scratch/usage.jsonl` has a `usage` sample from the last N minutes.
- `board` CLI validation: reject unknown flags everywhere, and refuse `in-review` from a qa specify claim.
- CI: a check that fails a PR which touches `.claude/` without an approval marker.
- A qa gate: every "Scope added" item in the ticket Comments maps to a named test.

Receipt fields to add to `cell` lines: `policy_version` (the git SHA of `.claude/`), test pass/fail counts, `retries`, `human_corrections`, and `rollback_point` (the base commit).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] An ADR or design note ranks the rules by incident count and cost, with evidence from `usage.jsonl`
- [ ] Each chosen rule has: its guide text, where the check lives (hook, board CLI, CI or test), what it blocks, and how a human overrides it
- [ ] The receipt schema is defined, and the orchestrator genome is updated to match (a brain gate: the orchestrator applies it with the user's yes)
- [ ] Implementation tickets are split out for the relay; nothing is built in this ticket

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request, after comparing our loop with a harness-engineering checklist the user shared. The biggest gap found: rules exist only as prose.
- **unknown, 2026-09-28:** Scope added (user, 2026-09-28): structured outputs, following the post. (1) Contract: on claim, the cell writes a JSON block into the ticket (goal, inputs, output, constraints, done_when) derived from the criteria plus the Comments scope, so the task can't be silently redefined. (2) State: every handoff starts with a JSON block (ticket, current_step, artifacts, decisions, failures, pending) so the next session inherits state, not a retelling. (3) Receipt: each cell's final report ends with a JSON receipt (context_sources, policy_version, tools_used, tests {passed, failed}, retries, human_corrections, tokens, artifact, rollback_point), which the orchestrator appends to usage.jsonl. Design the schemas, and where a check validates them (for example, board release refuses a handoff that has no valid state block).
- **unknown, 2026-09-28:** Scope added (user, 2026-09-28): borrow from AgentSystemLabs/agent-office. Bounded meeting patterns (round limit, token budget, declared output file), agents launched with --disallowedTools as permissions enforced outside the model, and 'next cell that needs you' attention routing. See .scratch/_handoffs/refs/agentsystemlabs-agent-office.md (user, 2026-09-28).
- **architect, 2026-09-28:** Resolved via ADR docs/adr/0009-mechanical-checks-for-most-skipped-rules.md: ranks 5 rules by usage.jsonl incident count/cost, gives each a check/block/override, and defines Contract/State/Receipt JSON schemas. Split into 6 follow-up tickets: organism-infra/17 (schemas, unblocked), 18 (board CLI hardening, blocked by 17), 19 (usage-freshness hook, unblocked, edits .claude/settings.json), 20 (qa scope-to-test gate, unblocked), 21 (handback tool-refusal logging, blocked by 17), 22 (.claude/ CI approval gate, unblocked), 23 (orchestrator genome receipt application, blocked by 17+18+21, edits .claude/agents/). Coordinated with organism-infra/16 via a comment there: Receipt's worktree{path,clean} field shape is defined here, 16 still owns populating it. Two brain-gate questions could not be asked live -- AskUserQuestion is unavailable to an architect subagent -- and are recorded in the ADR Comments and relayed to the orchestrator: (1) ship all 5 rules or trim to top 3, (2) hard-block board release on a missing State block, or warn-and-log. Tool refusal: AskUserQuestion, 'not available inside subagents'.
- **architect, 2026-09-28:** ADR 0009 written, 6 follow-up tickets (17-23) split out with blocking edges; two brain-gate questions relayed to orchestrator/user in Comments
- **unknown, 2026-09-28:** Correction: that is 7 follow-up tickets (17-23 inclusive), not 6.
- **unknown, 2026-09-28:** Handoff: .scratch/organism-infra/handoffs/15-architect.md
- **Decided (orchestrator, 2026-09-28):** The user accepted ADR 0009: all 5 rules ship (17 through 23), and `board release` hard-blocks without a handoff, with a logged `--force`.
