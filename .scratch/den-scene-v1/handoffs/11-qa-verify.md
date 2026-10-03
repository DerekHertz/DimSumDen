```json
{
  "ticket": "den-scene-v1/11-bigger-cuter-bao",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done. QA pass. T5 literal synced (commit e865db4 on feat/11-bigger-cuter-bao-8). Scene tests 500 of 500, npm test 1939 of 1939, 0 skipped. Ticket stays at in-review for security (risk-check) and the user's visual verdict.",
  "artifacts": [
    "branch feat/11-bigger-cuter-bao-8, commit e865db4 (parent 9d4e79d)",
    "apps/ui/src/scene/bao-placement.test.mjs (PILL.y 0.1 -> -0.05 and its comment, nothing else)",
    "/tmp/11-tests.txt (npm test output)"],
  "decisions": [
    "Verdict: QA pass. Tests: node --test apps/ui/src/scene/*.test.mjs = 500 pass, 0 fail, 0 skipped; npm test = 1939 pass, 0 fail, 0 skipped, 0 todo (summary lines read from /tmp/11-tests.txt myself). T2, T3, T5 and T9 (bao-pose, bao-seats, bao-placement) ran and passed, none skipped, so the numeric seat lowest-point check (within 0.02 at sit_still and the breathe samples) is covered by running tests.",
    "T5 literal sync: only PILL.y (0.1 -> -0.05) and its comment changed in bao-placement.test.mjs. No assertion changed. The developer and designer commits touched no test file (git diff --stat 66a99cb..9d4e79d lists none), so no specify test was removed or loosened.",
    "Kiosk-edge margin (computed with iso-projection and the real kiosk geometry, same as default-framing.test.mjs completeKiosk): Tea left edge 2.17 px and Pantry right edge 2.17 px at 375x667; 2.08 px at 360x640; 155.9 px at 1440x900. Matches the spec (2 px inside), and the A1 test (at least 1 px) passes.",
    "The 'Blocked' chip clipped at the left edge in m-light-ui.png is TRUE clipping of the 96 px chip box, but it is mostly pre-existing, and not the kiosk. ChipLayer.jsx has no edge clamp; a chip is centred on its panda. At 375 the Tea slot-0 panda stands at x 18.7 px, so the chip box runs -29.3 to 66.7 px (360: -30.0). Before this ticket (Tea at x -4.9, 0.3 nearer) it was -20.6: already clipped, now 8.7 px worse because Tea and Pantry moved out 0.3. Same on the Pantry side (right edge 404 px at 375). Slot 2 of each is inside (8.3 px). The shipped chip is narrower than the 96 px max box, so the visible clip is less than 29 px, but it is real. Not a test failure; no test covers chip-in-viewport. Suggest a follow-up: clamp chips to the viewport in ChipLayer, or the user decides it is fine for a 3-slot kiosk at phone width.",
    "N2 (back-left bamboo cluster at (-3.4, -8.5) vs the Library dashed ring): no overlap. Ring outer radius 0.65 about (-3.4, -7.65). Middle stalk centre is 0.850 from the pad centre, so the gap to the ring is 0.119 world with the joint radius 0.081 (0.161 for the side stalks at x -3.67 and -3.13). On screen that is 2.0 px at 375 and 6.0 px at 1440 (z factor sin(pitch) 0.577 times pixels per unit). So it is close but not touching; the designer's 'touches' is a close visual at 2x. banquet-layout's own 0.1 clearance test passes. Optional: move the cluster to z -8.8 as the spec's fallback if the user wants it looser.",
    "Grove at the default seed (1), geometric check only: the near stalks are all at least 0.3 outside Bao's footprint box (T8 passes for seeds 1, 3, 5, 7, 11). 0 leaf clusters within 0.3 of the box. Two of 18 ground tufts, (-0.32, -5.07) and (1.33, -4.21), both size about 0.38, fall inside Bao's footprint box and a third is 0.30 away. Under the -2 spec this is accepted (the user picked the grove as rendered, T8 comment), and the designer's seven renders saw none poking through. Whether those two tufts show through Bao's lower back or feet is a visual call: UNVERIFIED.",
    "Near bamboo band vs the larger handoff arc (radius 6.1): sampled every station pair, the arc comes within r + 0.25 of exactly one near stalk, #10 at (4.84, -4.24), and never within 0.25 of Bao's footprint box. So a handoff basket passes by one near stalk. Whether it reads as passing through it is visual: UNVERIFIED.",
    "Diff review against 66a99cb (the code-review the developer skipped): changed files are Den.jsx, Market.jsx, banquet-layout.mjs, bao-pose.mjs (new), bao-seats.mjs (new), handoffs.mjs, iso-projection.mjs, roam.mjs, all in apps/ui/src/scene/, plus my test commit. No glb, rig or Blender change, no package.json or lockfile change, no new dependency (three is already used). No debug code: the single console.error in Den.jsx is the once-only bake-failure log, with a try/catch so a failed bake leaves Pass pandas on their static seats. Other files outside scene/: none.",
    "Review nits, not blockers: (a) Den.jsx useMemo sets seats.baked = null inside the memo body (a side effect in render, harmless because the cleanup effect resets it too). (b) With lod true, Bao's fur branch is skipped by the if / else-if, so softenPatches would not run; Bao is not rendered with lod today, so nothing breaks. (c) seatWorld and railWorld allocate a vector per call per frame; negligible at 3 pandas. (d) Designer nits N1 (product/architect slot 2 hidden behind Bao), N3 (ragged patch edges at 2x), N4 and N5 remain open; none blocks."],
  "failures": [
    "jev verify (shadow): pick light, conf 0.68, effective full. Informational in shadow mode; I ran as light verify as the orchestrator instructed and found nothing needing judgment beyond the rules.",
    "Scout in the first dispatch was told to use the glob and did; its report matched the file (1939 pass)."],
  "pending": [
    {"item": "npm run risk-check on the branch, then security if it hits. The orchestrator opens the PR on green CI (not before the user's visual verdict).", "owner": "orchestrator"},
    {"item": "User visual verdict: d-light.png, d-dark.png, extra/x-d.png under .scratch/den-scene-v1/refs/review-11/. A human should also look at (1) the two tufts at (-0.32, -5.07) and (1.33, -4.21) against Bao's lower back and feet, (2) a handoff basket passing near stalk #10 at (4.84, -4.24), (3) the Blocked chip clipped at the 375 left edge (pre-existing, 8.7 px worse), (4) the Library pill and the back-left stalk (2 px at 375).", "owner": "user"}
  ]
}
```

## State

QA pass on feat/11-bigger-cuter-bao-8 at e865db4. Scene suite 500 of 500, npm test 1939 of 1939, 0 skipped. Ticket remains in-review.

## Criterion to test map (unchanged from specify)

T1, T4, T7, T8, T14 in part 1 files; T2 bao-pose; T3, T5, T6 bao-placement; T9 bao-seats; T10 to T13 bao-pose and bao-seats. Human-verified: same-frame ordering (designer R1 measured 23 of 23 frames), review items R2 to R8 (designer, partly done above).
