# 23: Apply the Receipt schema and new checks to the orchestrator genome

**Type:** task

**Priority:** P2

**What to build:** Update the orchestrator genome (`.claude/agents/orchestrator.md`) so it: appends every cell's Receipt (`organism-infra/17` schema) verbatim to `usage.jsonl` as `kind:"cell"`, reads `tool_refusals` out of each handback (`organism-infra/21`) instead of re-deriving it from prose, and documents the usage-freshness override variable (`organism-infra/19`) and the board-release `--force` override (`organism-infra/18`). This is `organism-infra/15`'s own acceptance criterion 3: "the receipt schema is defined, and the orchestrator genome is updated to match (a brain gate: the orchestrator applies it with the user's yes)."

This ticket changes `.claude/agents/orchestrator.md`. Only the orchestrator applies it, and only with the user's explicit yes — get that before editing, not after.

**Blocked by:** 17, 18, 21 (the schema and the two checks it wires into must exist first)

**Status:** closed

- [ ] The orchestrator genome's handback-processing section appends a Receipt object (not a free-text summary) to `usage.jsonl` per cell return
- [ ] It reads `tool_refusals` from the handoff's `## Tool refusals` section and files it into the Receipt
- [ ] It documents `ORGANISM_USAGE_GATE_OVERRIDE` and `board release --force` as named, logged escape hatches, not silent workarounds
- [ ] The user has said yes to this specific genome diff before it's applied (record the comment)

## Comments

- **Created (architect, 2026-09-28):** Split from `organism-infra/15` per its own acceptance criterion 3. Deliberately last in the dependency chain: it's the one ticket in this batch that edits `.claude/agents/` directly.
- **orchestrator, 2026-10-03:** Closed: superseded by organism-infra/116 trim (refocus, docs/refocus/triage-2026-10-02.md)
