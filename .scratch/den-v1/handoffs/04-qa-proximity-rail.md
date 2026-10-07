# den-v1/04 mobile rail QA: focused pass at 0f891dc

```json
{
  "ticket": "den-v1/04-proximity-card",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA focused pass at 0f891dc: mobile header interception fixed; final HEAD CI/security/user visual review pending.",
  "artifacts": [
    "codex/den-v1-04-proximity-card@0f891dc",
    "/workspace/work/proximity-qa/rail-final-probe.log",
    "/workspace/work/proximity-qa/placement-probe.mjs",
    "04-qa-proximity.md",
    "04-qa-proximity-placement.md"
  ],
  "decisions": [
    "Targeted disposable real-DOM Playwright probe exited0: desktop1440x900 and coarse-phone375x667.",
    "Real Tab release then queue→Needs-you→queue header clicks pass without force; header bounding boxes disjoint; three queue rows and dispatch Needs content reachable by rail scrolling.",
    "Proximity card/visible rail/pad/entry rectangles remain disjoint; actual pointer-lock recapture, second Tab release and Leave pass at both viewports.",
    "Only one mobile CSS declaration changed since72bc7c5, inside max-width599px; no source or permanent test edits by QA and no full-suite/smoke repetition.",
    "Earlier focused43/43 and smoke/build11/11 atf1dd9a4, browser1/1 and four viewport placement geometry at72bc7c5 are retained evidence. Parent reports72bc CI success run37567747432; final0f891dc CI pending."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Security review, final0f891dc CI green, and user final visual feedback before merge.",
      "owner": "orchestrator"
    }
  ]
}
```

Branch: codex/den-v1-04-proximity-card. Worktree: /workspace/DimSumDen-proximity.

Targeted command actually run: timeout120s node /workspace/work/proximity-qa/placement-probe.mjs --rail-check (supported escalation); exit0. Disposable probe uses live App DOM, actual pointer lock, softened scene rendering, nonempty ready-for-human dispatch Needs-you fixtures, three-row frontier queue, and supported no-session banner. No forced/programmatic header clicks.

At1440x900 both rail panels expanded; desktop measurements exactly match72bc7c5: nearby(16,519.22,330,256.78), rail(1104,16,320,780), entry(16,88,310,116). The single new declaration only applies below600px, so768x900/650x800 placement remains unchanged by source inspection (their previous measurements are in04-qa-proximity-placement.md).

At375x667 coarse pointer, in free-cursor walk mode, real clicks switch queue→Needs-you→queue successfully. Mobile accordion exclusivity remains expected. Header bounding boxes never intersect. Expanded queue last row scrolls into view with rail scrollTop412, scrollHeight522/clientHeight110, visible row height32px. Expanded Needs-you code content scrolls into view with scrollTop165, scrollHeight538/clientHeight110, visible content height66px. No page errors.

Phone nearby(16,238.20,330,150.80), rail(16,74,343,110.09), walk pad(16,411,156,102), entry(16,523,236.78,44): all proximity/rail/pad/entry intersections zero. Rail-to-card gap54.11px; card-to-pad gap22px; card stays inside viewport. Clipping-aware rectangles account for scrolled rail children, while full header rectangles independently verify header separation. Look around actually recaptures the canvas at desktop and phone, then Tab releases again and Leave exits.

Prior bounce is resolved: mobile .cards .card flex-shrink:0 preserves card/header heights while capped rail scrolls. Diff72bc7c5→0f891dc is exactly this one declaration; no assertions changed or source edited by QA. Product state/model/capability/read-only/live-update and cursor coverage remains in prior focused evidence (43/43 atf1dd9a4, browser1/1 at72bc7c5); final CSS-specific behavior is tested here. Original card appearance is user-approved; updated visual verdict remains user-owned.

Full npm-test acceptance is not claimed green locally. Earlier full-suite timeout/errors are recorded in04-qa-proximity.md; prior72bc CI success(run37567747432) is parent-reported, and final0f891dc CI must still pass. Security and user visual review remain pending.

Failed calls: none in this recheck; prior harness corrections and genuine30s header interception are retained in04-qa-proximity-placement.md. Browser/server closed by finally. Receipt: clean worktree, no source edits. Final context:null.
