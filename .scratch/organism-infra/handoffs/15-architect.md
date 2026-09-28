## Tool refusals

`AskUserQuestion`: "AskUserQuestion is not available inside subagents." Needed it for two brain-gate questions (see Decisions made). Relayed them to the orchestrator/user instead of proceeding as if approved.

**State**: done — ADR written, ticket resolved, 7 follow-up tickets filed with blocking edges.

**What changed**: No code. New file `docs/adr/0009-mechanical-checks-for-most-skipped-rules.md` (status: proposed, pending the two open questions below). New tickets `.scratch/organism-infra/issues/17` through `23`. Ticket `organism-infra/15` released `resolved` with a summary comment. Added a coordination comment on `organism-infra/16` (worktree lifecycle) about the shared `worktree{path,clean}` Receipt field, no other edit to 16.

**Decisions made** (full reasoning in ADR 0009; not duplicated here):
- Ranked 5 rules by `usage.jsonl` incident count/cost: board CLI hardening (3 incidents) > handback tool-refusal reporting (2) > usage-% freshness gate (1, highest cost) > qa scope-to-test mapping (1) > `.claude/` CI approval gate (0 incidents, included on hard-to-reverse cost).
- Defined Contract (on claim), State (handoff header), Receipt (final report) JSON schemas per the ticket's Comments scope. `policy_version` = `git rev-parse HEAD:.claude` (verified working).
- Receipt's `worktree` field is shape-only here (`{path, clean}`); `organism-infra/16` still owns computing it — don't duplicate.
- Two questions couldn't be asked live (tool refusal above), so they're **open**, not decided: (1) ship all 5 rules or trim to top 3 — recommend all 5; (2) State-block check on `board release` — hard block with logged `--force`, or warn-and-log — recommend hard block. Ticket 18 implements the hard block by default but flags this as overridable before it's claimed.

**Next step**: orchestrator raises the two open questions to the user (usage 21% was the framing note attached to this ticket's dispatch — surface current usage again when asking). Once answered, dispatch `organism-infra/17` (schemas, unblocked) first; it gates 18, 21, 23.

**Suggested skills**: `organism-protocol`, `domain-modeling` (for the deferred CONTEXT.md terms: Contract, State block, Receipt — proposed in ADR 0009 Consequences, not added).

**Gotchas**: `AskUserQuestion` is unavailable to any subagent dispatched via the `Agent` tool, only to a top-level `claude --agent` session — plan brain-gate questions to go through the orchestrator's own turn, not a spawned architect/designer/etc. subagent, or expect them to come back as open questions in the handoff instead.
