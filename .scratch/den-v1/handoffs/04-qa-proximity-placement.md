# den-v1/04 narrow placement QA finding at 72bc7c5

```json
{
  "ticket": "den-v1/04-proximity-card",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Narrow placement geometry passes at 72bc7c5; mobile rail header interception prevents final QA pass.",
  "artifacts": [
    "codex/den-v1-04-proximity-card@72bc7c59d65d94301227a4ec9c3569534ca3fc11",
    "/workspace/work/proximity-qa/placement-browser.log",
    "/workspace/work/proximity-qa/placement-probe-final.log",
    "/workspace/work/proximity-qa/placement-probe-phone.log",
    "/workspace/work/proximity-qa/placement-probe-phone-needs.log"
  ],
  "decisions": [
    "No source edits; CSS-only change since 43/43 focused and 11/11 smoke/build at f1dd9a4, so no broad/full/smoke repeats.",
    "At 1440x900,768x900,650x800 both rail panels expanded; at 375x667 tested both supported mutually exclusive mobile states. All nearby-card/rail/entry/pad bounding boxes disjoint.",
    "Actual pointer-lock browser acceptance passes 1/1 at 72bc7c5; phone Needs-expanded probe also recaptures/releases/leaves successfully."
  ],
  "failures": [
    "375x667 coarse pointer: after expanding queue in walk mode and releasing cursor, clicking Needs-you header fails with locator.click: Timeout 30000ms exceeded; expanded Stations header intercepts pointer events. Existing cards must stay clickable under added user scope.",
    "Probe harness corrections: missing requests.mjs search; Playwright CJS import; invalid simultaneous-open mobile assertion (existing accordion exclusivity)."
  ],
  "pending": [
    {
      "item": "Fix narrow rail header interception, likely shrinkage from den.css:38 capped flex rail; return final commit for phone interaction recheck.",
      "owner": "developer"
    },
    {
      "item": "Final-HEAD full suite green in CI, security review, and user final visual feedback.",
      "owner": "orchestrator"
    }
  ]
}
```

One actual browser acceptance test passed (1/1, zero failures/cancels/skips, 13.29s). Prior 43/43 focused and 11/11 smoke/build apply to f1dd9a4; only den.css changed since. Full npm test is not claimed green and remains final-HEAD CI acceptance. See 04-qa-proximity.md for prior full-suite limitations and exact failures.

Placement geometry passed with expanded Needs you (ready-for-human dispatch ticket) and three-row queue fixtures. Desktop panels simultaneously expanded; mobile panels are mutually exclusive by existing Cards.jsx:237-258 behavior. Rectangles (x,y,w,h):

| Viewport | Nearby card | Rail | Entry | Coarse pad |
|---|---|---|---|---|
|1440x900|16,519.22,330,256.78|1104,16,320,780|16,88,310,116|hidden|
|768x900|16,519.22,330,256.78|432,16,320,780|16,88,310,116|hidden|
|650x800|16,419.22,282,256.78|314,16,320,680|16,88,310,116|hidden|
|375x667|16,238.20,330,150.80|16,74,343,110.09|16,523,236.78,44|16,411,156,102|

All card/rail/Needs/queue/entry/pad intersections are zero in supported states; card inside viewport. Phone rail-to-card gap54.11px, card-to-pad gap22px. Actual phone switching queue→Needs is a separate failure: locator.click times out30000ms because Stations header intercepts pointer events. This blocks the added acceptance that existing cards are clickable. Source location to review: apps/ui/src/scene/procedural/den.css:38; likely flex children shrink inside capped rail (cause inferred; no QA product edits). Needs-expanded state measured by opening Needs before walking, without forcing clicks or changing source; geometry and Look-around recapture both pass.

The fixture has session404/no-session banner, matching supported no-session UI; all tests use real app DOM and softened scene rendering only. Rail child rectangles are clipped to scrolling ancestors for visible geometry. No screenshot-based visual verdict is claimed.

## Failed calls

- exec_command rg overlay/requests.mjs: “No such file or directory (os error2)”; used rg --files and Cards import to find overlay-model.mjs; search path mistake.
- Disposable probe first run: “TypeError: Cannot read properties of undefined (reading 'launch')”; corrected CJS Playwright import to require; harness mistake.
- Disposable probe first four-viewports run: expanded=['false','true'] vs expected=['true','true'] at phone; corrected invalid mobile simultaneous-open assertion to supported exclusive states; harness mistake, not feature failure.
- Phone state-switch probe: “locator.click: Timeout30000ms exceeded”; Stations card-toggle intercepts Needs card-toggle; genuine interaction finding. Independent Needs-expanded state geometry then passed, without suppressing interception.

No product source edits. Clean worktree /workspace/DimSumDen-proximity. Final context:null. All commands bounded timeout120s; servers/browser closed through finally.
