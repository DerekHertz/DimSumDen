```json
{
  "ticket": "den-scene-v1/11-bigger-cuter-bao",
  "cell": "designer",
  "mode": "review",
  "current_step": "PARTIAL at 83k context. Verdict so far: pass with nits (no blocking finding in what was checked). PAD_CHIP_Y chosen and committed (-0.05, commit 9d4e79d on feat/11-bigger-cuter-bao-7). Unchecked items listed under pending; they need a fresh designer cell or the user's eye.",
  "artifacts": [
    "apps/ui/src/scene/Den.jsx (PAD_CHIP_Y 0 -> -0.05, commit 9d4e79d; only that constant and its comment)",
    ".scratch/den-scene-v1/refs/review-11/d-light.png (USER LOOK: default frame, light, 1440x900)",
    ".scratch/den-scene-v1/refs/review-11/d-dark.png (dark), m-light.png, m-dark.png (375x667), m-light-ui.png (375 with the shell UI), d-rm.png (reduced motion)",
    ".scratch/den-scene-v1/refs/review-11/extra/x-d.png (USER LOOK: Bao close-up at 2x with three Pass pandas on every seat: rail, left shoulder, right shoulder), extra/x-m.png (same at 375)",
    ".scratch/den-scene-v1/refs/review-11/pady-0/ and pady-m005/ (Library pill at 375 and 1440, PAD_CHIP_Y 0 and -0.05)",
    "Harness: /home/dhertzell/.claude/jobs/d78c143e/tmp/render.mjs (real build; in-memory probe plugin only; env PADY and EXTRA=1 add a pill override and synthetic product/architect/orchestrator slots 0-2)"],
  "decisions": [
    "PAD_CHIP_Y = -0.05. Moves the sprite 1.18 px lower than 0 at 375x667 (0.05 x 28.85 x 0.8165), so the Library pill top goes from 261.0 px (y 0.1) to 263.36 (y 0) to about 264.5 (y -0.05), against the product chip bottom at 263.0 px: about 1.5 px clear (computed from the developer's numbers, not re-measured on a chip render). Rendered at 375 and 1440: the pill still reads centred on the dashed ring, the sprite is depthTest false so the floor never clips it. QA: set PILL.y to -0.05 in the T5 test literal.",
    "R1 PASS (measured, not just read): a probe logged the call order of Den.jsx's useFrame bodies. In 23 of 23 sampled frames the order was bao, then product and architect and every other roamer (fig and roam entries), then the Pass figure's seat write. Bao's pose and updateMatrixWorld always run before any seat reader, so there is no one-frame lag. The Market ServiceBell reads the rail store after the Market mount, which is also after Bao.",
    "R2 pass with a nit: product and architect slot 0 sit on Bao's shoulder top beside the cheek and read as seated; no visible cheek intersection or float at 2x (x-d.png). Slot 1 (z -3.78) reads as a panda peeking from behind slot 0 and the arm (head and book visible), seated not floating. Slot 2 (z -4.18) is fully hidden behind Bao from the default camera. See nit N1.",
    "Orchestrator rail: three pandas on the rail top, rail on the crown, ears clear; the three overlap a little at the shoulders, as the spec predicted for 0.44 each on a 2.0 rail.",
    "Default frame (d-light, d-dark, d-rm, m-light, m-dark): no console errors in any of the six renders, Bao reads big and plush, face squint and soft patches read as intended, nose black, Library and Drum pills sit on the floor inside their dashed rings, grove tufts visible and none seen poking through Bao at the default seed.",
    "Dark theme: the ground and Bao are identical to light (only kiosks, pills and the chip palette change). Treated as unchanged from before this ticket (the green ground is not themed), so not a finding."],
  "failures": [
    "Context: the designer genome's 80k rule was crossed while rendering (83.6k after the extra shots; the images cost the most). The pill and chip check, R1, R2 and the PAD_CHIP_Y decision are done; the rest is listed in pending.",
    "Worktree guard: a compound `ls ...; git status; git log` was refused as too complex; reran as plain calls."],
  "pending": [
    {"item": "Not checked: the kiosk-edge margin at 375 (expected 2 px; m-light-ui.png shows the Tea kiosk at the left edge and its 'Blocked' status chip clipped on the left, which looks like an existing chip clamp, not this ticket, but needs a pixel measure); grove tufts and leaves against Bao's skin and feet at the default seed under a close crop (R8); the near bamboo band crossed by the larger handoff arc (R6); numeric seat lowest-point within 0.02 at sit_still and breathe (relied on the qa tests, 499 of 500 passing before this edit); content_squint at the other faces; click selection R5; Level 3 zoom R7; the /design:accessibility-review pass; the light-theme dashed ring at 1440 beside the stalk (N2). A fresh designer cell can finish these in about 15 tool calls using the harness path above.", "owner": "designer"},
    {"item": "Sync the T5 test literal PILL.y from 0.1 to -0.05 so 'shoulder pandas' status chips do not overlap either pill' goes green at 375x667. Do not move the pad.", "owner": "qa"}
  ]
}
```

## State

Branch feat/11-bigger-cuter-bao-7 at 9d4e79d (one designer commit, one constant). Ticket released at in-review. Renders under `.scratch/den-scene-v1/refs/review-11/` in the main checkout.

## Verdict (partial): pass with nits

No blocking finding in what was checked. For the user's visual verdict, look at `d-light.png`, `d-dark.png` and `extra/x-d.png` (the close-up, includes the squint face, patches and all three seat types).

## Findings (ranked)

Blocking: none seen.

Nits:
- N1. `apps/ui/src/scene/bao-seats.mjs` (slot step) and `Den.jsx` (slot clamp): product and architect slot 2 at z -4.18 is hidden behind Bao from the default camera (`extra/x-d.png`, only two pandas visible per shoulder). Slot 1 only peeks out. Suggested fix: step slots 1 and 2 up and forward instead of back, or accept that three products never show; ask the user if three of one type matters.
- N2. `apps/ui/src/scene/banquet-layout.mjs` back-left bamboo cluster (-3.4, -8.5): the stalk stands behind the right end of the Library pill and touches the dashed ring (`pady-0/pill-d.png`). The spec's own fallback applies: move that cluster back 0.3 (z -8.8). Not the pad.
- N3. Patch edges on Bao's face are ragged (a saw-tooth edge on the softened patches at 2x, `extra/x-d.png`). Reads fine at 1x. Suggested fix: feather over one more vertex ring in `softenPatches` (`Den.jsx`), or blur the vertex colour once.
- N4. At 375 the Library and Drum pill text is about 7 px tall (legible only on a retina crop). Existing scale, not this ticket. Suggested: a mobile pill scale bump in `PadChips`, in a later ticket.
- N5. The head's white fur reads light grey against the belly (`d-light.png`), a lighting level, not a colour bug. Suggested: leave unless the user finds it dull.

## PAD_CHIP_Y

-0.05, committed. Report to qa: PILL.y literal is -0.05.

Failed calls: see `failures` above.
