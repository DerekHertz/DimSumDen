# 01: Resident pandas, take-over and split-off

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** in-review

**Serves:** Den loop step 1 (the den is always populated; a running agent takes over its role's panda).

## What to build

`sceneFromState(snapshot)` in `apps/ui/src/scene/scene-from-state.mjs` returns one resident entry per role, always, placed at its station. A live agent in the snapshot's `agents` list (ADR 0016 decision 4, named `agents` under ADR 0019 decision 10; use a fixture until 106 lands) binds to its role's resident entry, which then carries the agent's id, state, ticket and latest tool. A second live agent of the same role becomes a split-off entry beside the resident one; when an agent ends, its binding (or split-off entry) goes. The renderer in `apps/ui/src/scene/` draws resident, taken-over and split-off pandas from the existing frozen glbs, with taken-over state shown by shape or icon as well as colour. Pure module first; no three, React or DOM in the model.

## Acceptance criteria

- [ ] With no agents running, the scene has exactly one resident panda per role.
- [ ] One live developer binds to the developer panda; a second live developer adds one split-off panda; ending either removes only its own binding.
- [ ] Each state (working, waiting on user, blocked, failed, done) maps to a distinct shape or icon, not colour alone.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-03:** Re-scoped (user, 2026-10-03): land PR #151 (Codex's procedural den, branch codex/procedural-den-frontend), which covers den-v1 01, 03 and 04 in one change; review it against this ticket's criteria and fix the gaps on that branch. Batch D1 = den-v1/01, 03, 04, one PR.
- **qa, 2026-10-03:** QA bounce (batch D1 @94221b2): frontend.test.mjs:34 AC1 asserts roamers only, herald has no resident; AC2 two-developer bind/end untested; frontend.test.mjs:91 AC3 compares one state pair only. See 01-qa handoff.
- **orchestrator, 2026-10-03:** User 2026-10-03: paused 04 (parked). Batch D1 is now 01 + 03 only. Fix round on #151 (codex/procedural-den-frontend @ 94221b2): 01 tests, 03 walk() core + tests + smoke walk check, exponential zoom contract (smoke zoom/pan, docs, tests). Goal: get the updated UI wired and merged.
- **qa, 2026-10-03:** QA pass (batch D1 @0604c76): npm test 1984/0/0; AC1-3 covered in frontend.test.mjs and chip-model.test.mjs. Herald has no resident (scope call). See 01-qa-2.
- **orchestrator, 2026-10-03:** User 2026-10-03: herald stays out of the den for v1 (no resident panda); a herald character design comes later. Not a gap for 01.
- **designer, 2026-10-03:** Design pass (batch D1 @0604c76): five state chips plus Queued distinct by word, glyph and tone in both themes; Failed chip right (triangle, alarm, dotted). Low follow-ups F4 Needs you vs Blocked glyph near-identical, F5 dotted vs dashed 1px. See 01-designer-review.
