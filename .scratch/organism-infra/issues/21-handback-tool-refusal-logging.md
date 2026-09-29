# 21: Handback tool-refusal section, logged by the orchestrator

**Type:** task

**Priority:** P2

**What to build:** Per ADR 0009 decision 2's ranked #2 rule, add a mandatory `## Tool refusals` heading to the `handoff` skill's template (`none` is a valid, explicit entry) and a `tool_refusals` array to the Receipt schema (`organism-infra/17`). When the orchestrator processes a cell's handback, it greps the handoff for that heading and files its contents into the cell's Receipt before appending to `usage.jsonl`; a missing heading is itself logged as a `kind:"incident"` line (the same treatment a missing usage sample gets).

This closes two incidents: a refused compound `cd`+heredoc command that went unreported ("no environment issues" anyway, `ci-cd/04`), and a refused main-checkout write that was worked around without being logged as a refusal (`ci-cd/04`, security).

**Blocked by:** 17 (Receipt schema and `validateReceipt`)

**Status:** ready-for-agent

- [ ] The `handoff` skill template includes a `## Tool refusals` heading; an empty section is invalid, `none` (or a listed refusal) is required (test)
- [ ] The orchestrator's handback-processing step extracts `## Tool refusals` content into the Receipt's `tool_refusals` field (test)
- [ ] A handback with no `## Tool refusals` heading produces a `kind:"incident"` line in `usage.jsonl` naming the missing section (test)
- [ ] A handback listing a refusal is logged into `usage.jsonl` without the orchestrator needing to re-derive it from the prose report

## Comments

- **Created (architect, 2026-09-28):** Split from `organism-infra/15` per ADR 0009 decision 2. Evidence: `usage.jsonl` incidents on `ci-cd/04`, 2026-09-28T12:00:00Z and 12:30:00Z.
