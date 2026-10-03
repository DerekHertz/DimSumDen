# 19: Usage-% freshness hook on Agent dispatch and merge/push

**Type:** task

**Priority:** P2

**What to build:** A `PreToolUse` hook (Claude Code hook config) on the `Agent` tool and on `gh pr merge`/`git push` to `main`, per ADR 0009 decision 2's ranked #3 rule. Blocks the call unless `.scratch/usage.jsonl` has a `kind:"usage"` line with `ts` inside the last 30 minutes. This is the mechanical backstop for the incident where a session ran from 30% to 82% of the 5-hour window with no check in between (`usage.jsonl` line 20) — the existing fix was prose in the orchestrator genome, which is exactly the kind of rule this ticket batch is meant to stop relying on alone.

Override: an env var (`ORGANISM_USAGE_GATE_OVERRIDE=1`) lets one call through; the hook itself appends a `kind:"incident"` line to `usage.jsonl` recording the override (so overrides stay visible, they aren't silent).

This ticket edits `.claude/settings.json` (hook config) — a brain gate. Only the orchestrator applies it, with the user's yes.

**Blocked by:** None (can start immediately; the gate above applies to landing it, not to designing/building it)

**Status:** parked

- [ ] Dispatching via `Agent` with no `usage` line in the last 30 minutes is blocked, naming the missing sample (test)
- [ ] Dispatching via `Agent` within 30 minutes of a `usage` line succeeds (test)
- [ ] `gh pr merge` and a `git push` to `main` follow the same rule (test)
- [ ] `ORGANISM_USAGE_GATE_OVERRIDE=1` lets the call through and appends a `kind:"incident"` line to `usage.jsonl` (test)
- [ ] The orchestrator genome's dispatch/merge steps document the override variable and when it's appropriate to use

## Comments

- **Created (architect, 2026-09-28):** Split from `organism-infra/15` per ADR 0009 decision 2. Brain gate: this ticket changes `.claude/settings.json`; get the user's explicit yes before applying, per organism-protocol.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
