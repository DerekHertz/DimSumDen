# den-v1/04 QA proximity verification: placement follow-up pending

```json
{
  "ticket": "den-v1/04-proximity-card",
  "cell": "qa",
  "mode": "verify",
  "current_step": "43 focused tests and 11 UI smoke checks pass at f1dd9a4; no verdict, releasing for developer placement fix and narrow QA recheck.",
  "artifacts": [
    "codex/den-v1-04-proximity-card@f1dd9a414a44ab00bfce8f0defc8b94460f79313",
    "/workspace/work/proximity-qa/focused-tests.log",
    "/workspace/work/proximity-qa/smoke-ui.log"
  ],
  "decisions": [
    "Approved narrow verify: 43 focused tests and final smoke sequentially, each bounded at 120s; no full-suite repeat.",
    "No source edits. Existing test assertions preserved; browser fallback removed to exercise actual pointer lock.",
    "Legacy state/tool behavior reviewed at model seam and scene source; current tool is read from newest raw cells row independently of floating bubble expiry.",
    "Original visual card appearance human-verified by user; updated cursor visual verdict remains with user."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Move proximity card lower-left away from right-side queue/Needs-you rail per user finding; return final commit for narrow QA placement check.",
      "owner": "developer"
    },
    {
      "item": "Full npm test at final HEAD must be green in CI; prior non-final run timed out at 300s with 725 pass, 5 fail, 131 cancelled.",
      "owner": "orchestrator"
    },
    {
      "item": "Security review after risk-check hits; updated user cursor feedback before merge.",
      "owner": "orchestrator"
    }
  ]
}
```

Branch: codex/den-v1-04-proximity-card, f1dd9a4. Worktree: /workspace/DimSumDen-proximity.

Results actually run: 43/43 focused tests, 0 failed/cancelled/skipped/todo, 17.27s; npm run smoke:ui exited 0, 11/11 checks including its production build. Both commands ran sequentially under timeout 120s with supported escalation for child Node/Chromium execution. Logs are in /workspace/work/proximity-qa/.

## Criterion coverage

- Nearest/reach/facing: proximity-card.test.mjs, “walking toward pandas shows the nearest one in reach and facing the viewer” and “reach and facing use world coordinates and ignore missing positions”.
- Idle card/reasons: “a resident with no live agent keeps its role and disables every action with a reason”; browser verifies visible resident and four disabled buttons.
- Snapshot capabilities/ticket/state/tool/pending approvals: “the bound agent supplies state, ticket, tool and runtime capability flags”; ended/missing/unrelated approval cases also pass.
- Legacy board-bound state/tool without invented bridge handle: “a board-bound panda keeps its working details even before it has a bridge control handle”. RestaurantDen.jsx:135-140 selects matching runtime agents and newest raw cells row; the card reads cell.tool without the bubbleOf TTL at live-actors.mjs:35-40. This scene/TTL wiring was source-reviewed; no claim of a browser integration test for aged board-cell tools.
- Live SSE: apply-event.test.mjs, “agent changes keep a live card's state and tool current without mutating the snapshot”.
- Read-only actions: browser verifies four disabled controls and no POST after T/F/A/D; ProximityCard.jsx has no action handlers.
- Added cursor scope: frontend.test.mjs, “Tab frees the cursor without leaving first person, clears movement, and mouse look can resume”; actual browser test locks canvas, releases via Tab, keeps walk mode/card, clicks existing station-card toggle, recaptures via Look around, moves away and exits. No page errors.
- npm test green: pending final-HEAD CI. Not rerun or claimed green in this pass. Original appearance is human-verified; updated cursor visual feedback remains pending.

## Assertion and scope review

No new qa-specify commit exists for this implementation round (old 04-qa.md was a missing-feature bounce at 94221b2). Compared final tests against b515f06 and first implementation 0edd84b: existing assertions were not removed or loosened. New model/frontend/live-update cases are additive; browser removes only the artificial pointer-lock fallback and adds real capture/release/recapture assertions. No changed file outside the card, scene/UI integration, live state update, and user-added cursor scope was identified.

## Full-suite limitation and exact prior failures

Historical log /workspace/work/proximity-verification/verify-proximity-test.log is from the earlier developer run, before final fixes, not this QA run. At 300s: 725 passed, 5 failed, 131 cancelled. Exact five failures:

1. apps/bridge/cells/conformance.test.mjs:1074 — “runSpikes S4b: sleeps that survive child-only signals are cleared by the group signal (group-kill) and every recorded pid is gone”; “leftover sleep 61 pids were not killed”.
2. apps/bridge/cells/conformance.test.mjs:1083 — “runSpikes S4b: a sleep in its own process group outlives the group signal (no-go) and is still killed at the end”; “leftover sleep 61 pids were not killed”.
3. apps/bridge/cells/conformance.test.mjs:1091 — “runSpikes S4b: a child that ignores stdin EOF mid-call is a no-go and the runner still ends it”; surviving PID array instead of [].
4. apps/bridge/cells/host-shutdown.test.mjs:68 — “process.exit() while children are alive: the exit handler SIGKILLs them synchronously”; “timed out after 3000 ms waiting for children 3495,3496 to be gone”.
5. apps/ui/den-scene-mounted.test.mjs:61 — “PR #162's agents, review and restaurant test files pass on main, in one process under 90 s”; expected TAP /# fail 0/ but Node24 nested reporter emitted “ℹ fail 0” after 20/20 passed (known organism-infra/180).

No new environment issues or failed calls in this QA stage. The earlier timeout/failures remain recorded above and require final CI validation.

Receipt: clean worktree; no source edits. Final context: null. No verdict published; releasing claim for the developer card placement follow-up. Full-suite criterion remains pending CI.

User steering after completed checks: proximity card overlaps right-side rail. Orchestrator will move it lower-left in CSS; QA releases claim for the developer placement fix. No verdict comment has occurred.
