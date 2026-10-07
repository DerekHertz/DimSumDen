# 04: Proximity card: walk up to a panda and see who it is

**Type:** feature

**Priority:** P1

**Blocked by:** 01, 03, den-layout/03, den-layout/04

**Status:** resolved

**Serves:** Den loop step 3 (walk up to a panda and get its card).

## What to build

A new pure module `cardFor(scenePandas, approvals, viewer) -> Card | null` in `apps/ui/src/overlay/` picks the nearest panda within a reach radius and a facing cone of the viewer and returns its role, ticket, state, current tool, any pending approval, and the T/F/A/D capability flags (each disabled one with a reason). The overlay shows the card in walk mode. This ticket is read-only: the keys show but do nothing yet.

## Acceptance criteria

- [ ] Nearest panda in reach and facing wins; out of reach or facing away gives no card.
- [ ] A resident panda with no agent gives a card whose actions are disabled with the reason "no agent running".
- [ ] Capability flags follow the agent's runtime capabilities from the snapshot.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-03:** Re-scoped (user, 2026-10-03): land PR #151 (Codex's procedural den, branch codex/procedural-den-frontend), which covers den-v1 01, 03 and 04 in one change; review it against this ticket's criteria and fix the gaps on that branch. Batch D1 = den-v1/01, 03, 04, one PR.
- **qa, 2026-10-03:** QA bounce (batch D1 @94221b2): cardFor does not exist; no proximity card, reach/facing logic, no-agent card or capability flags; PandaCard.jsx is a click detail dialog. See 04-qa handoff.
- **orchestrator, 2026-10-03:** User decision 2026-10-03: fix 04 on PR #151 (no split). Fix round builds the proximity card (cardFor, reach/facing, idle card, capability flags) per the spec; PandaCard click dialog is not the card.
- **orchestrator, 2026-10-03:** Parked: User 2026-10-03: paused; D1 fix round covers 01, 03 and zoom only. Get the updated UI wired first. PandaCard.jsx click dialog stays as-is on #151 for now.
- **orchestrator, 2026-10-06:** Now blocked by den-layout (approved breakdown, user 2026-10-06): builds on PR #162's scene once real agents drive it.
- **orchestrator, 2026-10-07:** Unparked: User approved building the read-only proximity card in this Codex session; scene dependencies are resolved.
- **developer, 2026-10-07:** User visual check: card looks good. Scope added: free the cursor while staying in first person so existing cards can be clicked; add Tab cursor release and a Look around control to resume mouse look.
- **qa, 2026-10-07:** QA bounce at 72bc7c5: browser acceptance 1/1 and all four placement geometries pass, but at 375x667 coarse pointer the expanded Stations header intercepts Needs-you header clicks (30s timeout); inspect den.css:38 capped rail shrinkage. Full-suite final HEAD remains pending CI. See 04-qa-proximity-placement.md.
- **qa, 2026-10-07:** QA focused pass at 0f891dc: real phone queue->Needs-you->queue clicks and scroll access pass; headers and proximity/rail/pad/entry are disjoint; desktop placement and pointer-lock recapture pass. Prior 43/43 focused and 11/11 smoke retained; no full rerun. Final HEAD CI, security and user visual review pending. See 04-qa-proximity-rail.md.
- **orchestrator, 2026-10-07:** Final frontend fix 0f891dc: QA and standards pass for phone rail scrolling and real queue/Needs-you clicks. PR #178 remains draft pending security review, final-head CI and user visual feedback. Latest design discussion is exploratory; no additional ticket is unparked.
- **orchestrator, 2026-10-07:** Paused by user for usage limit. Code pushed at0f891dc; PR #178 remains draft. Resume from04-security-proximity-paused.md and04-qa-proximity-rail.md. Security review unfinished, final CI and user visual feedback pending; interrupted claim released. No merge.
- **security, 2026-10-07:** Security pass at 0f891dc365b3112e4276b389dc1f71c611188aa6. No findings: loopback-only test server, React text rendering, disabled read-only actions, agent-scoped pending approval flags; no new shell, board-write, dependency or CI surface. Gitleaks passed across 6 commits; 42 focused tests passed. PR178 stays draft for the user visual verdict. Handoff: 04-security.md.
- **orchestrator, 2026-10-07:** User approved final layout and cursor behavior in this Codex chat. Security passed at 0f891dc; final-head CI test and security jobs both green (run37568176193). Both draft gates complete; final merge validation remains.
- **orchestrator, 2026-10-07:** Final merged-tree validation: 2413 passed, 1 failed, 0 cancelled/skipped in 144.3s. Low-80 checkout test reproduces identically on current main; scripts/jg.mjs and failing test are unchanged by PR178. Security and user visual gates passed; PR178 remains draft while the final validation blocker is diagnosed.
- **orchestrator, 2026-10-07:** PR178 merged as b028ec3 after security pass, user layout/cursor approval, green final-head CI and host integration 2414/2414 tests (126.6s). Initial isolated test failure was synthetic sandbox /tmp/.git; actual WSL host passes. Preview stopped; clean temporary reviewer/integration worktrees removed. PR183 standards/spec review complete with zero actionable findings; PR183 remains draft.
