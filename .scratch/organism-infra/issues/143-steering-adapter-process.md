# 143: Steering adapter, process half (106-D2): child wrapper and default runtime

**Type:** feature

**Priority:** P1

**Blocked by:** 141, 142, 195

**Status:** claimed

**Serves:** Den loop steps 3-4: the real runtime behind the host.

Scope source: ADR 0016 (as amended in PR #157) and the split table in `.scratch/organism-infra/handoffs/106-architect.md`. Parent: 106.

## What to build

Child wrapper over real pipes (a stub script speaks the stream), kill and process-group handling per S4b, shutdown wiring, the default runtime, `DEN_CLAUDE_BIN`, and `capabilities` set from the S8 and S3 outcomes (approval inbox off if S8 is outcome (d)). The user runs a manual conformance check after merge.

## Acceptance criteria

- [ ] A stub-script test dispatches, streams, holds and answers a permission request, and kills through the real-pipe wrapper.
- [ ] No grandchild survives a kill (per the S4b verdict).
- [ ] `capabilities` reflects the S8 outcome; with (d) the inbox is off.
- [ ] Shutdown's wait on pending spawns is bounded; past the bound it falls back to `killAllSync`, tested (security finding 3, PR #177).

## Comments
- **orchestrator, 2026-10-08:** Added acceptance criterion from security finding 3 on PR #177 (bounded shutdown wait on pending spawns, killAllSync fallback). host.mjs lows 1, 2 and 4 stay optional follow-ups. User approved 2026-10-07.
- **security, 2026-10-08:** Security bounce on ADR 0016 round 3 verdicts. HIGH: S4b go/plain is invalid; in all six S4b fixtures the tail -f call was blocked by the CLI (permission_denied) and the evaluator matched the child's own argv, so no tool was ever in flight. 143 should keep detached group kill until a valid re-run. S8 (c) residual acceptable with conditions (medium), S6b setup-invalid agreed, 195 low still open. Detail in 143-security.md.
- **orchestrator, 2026-10-08:** User 2026-10-08: drop 202 from Blocked by. ADR 0016 amendment 6 (PR #190, merged) keeps the detached process-group kill, so 143 can build now while 202 runs in parallel. Pending item from 143-architect-2 (open PR, merge on green, commit board) is done: PR #190 merged, ticket 202 on main. Status back to ready-for-agent; next relay hop is qa specify.
- **orchestrator, 2026-10-08:** Retro 2026-10-08: the pending item in handoffs/143-architect-2.md (open the PR for docs/143-adr0016-spike-verdicts) is obsolete. That branch does not exist, and the ADR 0016 verdict work goes ahead under ticket 202, merged in PR 193.
