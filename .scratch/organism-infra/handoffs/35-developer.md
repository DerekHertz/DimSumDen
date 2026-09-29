```json
{"ticket":"organism-infra/35-release-event-records-force","cell":"developer","current_step":"implemented and committed on feature/organism-infra-35-release-gate at cd4cb91; full npm test 266 pass, 0 fail","artifacts":["apps/organism-infra/board-service.mjs","apps/organism-infra/board-fixture.mjs","apps/organism-infra/board-cli-hardening.test.mjs","docs/adr/0008-board-service.md","docs/agents/issue-tracker.md"],"decisions":["gate filters candidates by State cell == claim cell, mode == claim mode when set, mtime >= claim lock mtime; no lock skips the binding","every op:release event gets force: Boolean(force); override event unchanged","schemas.mjs validateState untouched (cell/mode are gate-only fields)","fixtures infer cell/mode from the claim lock and push handoff mtime +60s"],"failures":[],"pending":[{"item":"apply the handoff skill text change below to .claude/skills/handoff/SKILL.md (brain gate)","owner":"orchestrator"},{"item":"qa verify, then security review","owner":"qa"}]}
```

## Summary

Done. Branch `feature/organism-infra-35-release-gate`, commit cd4cb91. Tests in `board-release-gate.test.mjs` unchanged and green.

- `board-service.mjs`: `release` passes the claim (cell, mode, lock mtime) into `validateHandoffState`, which skips non-matching handoffs. Release events carry `force`.
- Fixtures: `writeValidHandoff` (board-fixture.mjs) infers cell/mode from the claim lock and sets mtime 60s ahead. `stateBlock`/`writeHandoff` in board-cli-hardening.test.mjs gained `cell: "developer"` and the same mtime bump.
- Docs: ADR 0008 decision 11; issue-tracker.md Handoffs and Release events bullets.
- 34 case explained in a ticket comment (qa's handoff satisfied the old gate).

## Proposed .claude change (for orchestrator)

In `.claude/skills/handoff/SKILL.md`, line 11 area, after the sentence introducing the State block, add:

"The State block must also name its author: `"cell": "<your cell type>"` and, for moded cells, `"mode": "<mode>"` (e.g. qa `specify` or `verify`). `board release` refuses a handoff whose `cell`/`mode` differ from your claim, or that was written before your claim. Write the handoff after claiming and before releasing."

Also add `"cell"` (and `"mode"`) to the example State JSON in that skill.

## Notes

- Limit: cell/mode/mtime are self-declared; the gate catches stale or wrong-hop handoffs, not forgery (recorded in ADR 0008 decision 11).
- Handoffs written before this change lack `cell`; releasing an old ticket against them needs `--force`.
