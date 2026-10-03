# Orchestrator handoff 26 (2026-10-02)

State, not rules; the genome wins.

## Ticket in flight: den-scene-v1/11-bigger-cuter-bao (user picked option B, Soft bun)
Relay stage 1 (qa specify) is split into parts because cells hit 80k context.
- Designer direction, spec and amendment done: handoffs/11-designer-direction.md, 11-designer-spec.md, 11-designer-spec-2.md (the -2 file wins).
- qa specify part 1 DONE: branch `feat/11-bigger-cuter-bao-2`, commit 40fb260 (parent WIP 0802dfe on `feat/11-bigger-cuter-bao`, abandoned; delete it at worktree-gc). Handoff 11-qa-specify-2.md.
- NEXT: qa specify part 2 (pose/seat tests T2, T3 0.05 footprint, T5, T6, T9 posed-mesh, T10-T13; modules bao-pose.mjs, bao-seats.mjs; glb harness fixture). Branch from 40fb260 as a new branch (e.g. feat/11-bigger-cuter-bao-3) via `node scripts/cell-start.mjs --base 40fb260 --branch <new> --ticket den-scene-v1/11-bigger-cuter-bao --cell qa --mode specify`. Tell it to stay under 80k and use scout.
- Then: dispatch-context path exists at .scratch/_context/den-scene-v1/11-bigger-cuter-bao.md (add start-here line for qa specify, developer); `jev.mjs tier` before developer; designer review between developer and qa verify; light verify; risk-check; PR; merge on green; user visual verdict before merge.
- Flag to user: front kiosks end 2 px inside the 375px edge. Open question for user: slot 3+ placement of extra Pass pandas (non-blocking).
- Deferred by user: eye-patch overlay, fully three.js panda (suggest architect ticket after 11 merges).

## Unlogged
- qa specify part 1 cell: logged (92k tokens).
- Incident already logged for qa specify partial (context).

## Usage
Live read 38% 5h / 69% weekly at ~dispatch of qa specify. `usage.mjs` gave HTTP 429 once, then worked.

## Housekeeping
Worktrees to GC after merge: agent-a86475f05242e01e0 (119, locked), agent-a3a7..., agent-adb9..., agent-a94f..., agent-aed8..., agent-a158... (all clean). Run `node scripts/worktree-gc.mjs`, apply only per memory rule.
