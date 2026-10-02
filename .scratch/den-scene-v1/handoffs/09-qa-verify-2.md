# Handoff: 09 qa verify round 2 (light verify)

```json
{
  "ticket": "den-scene-v1/09-role-headgear-assets",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify passed at a79395d: all 1516 tests pass (0 skipped). My specify tests from b8895bd are unchanged. The developer's three test literal updates (pagoda-roof FRONT_ROOF eave 1.4→1.77, kiosk noren 1.4→1.77, station-labels tea y 2.0→2.37) correct expected values for the user's raised-eave decision; assertions unchanged. Material token extension (fail/pass added to headgear test) is an extension, not a removal. Round 2 fixes H1-H4, M1, M3, L1-L3 from the design bounce; M2 deferred to visual polish.",
  "artifacts": [
    "apps/ui/src/scene/headgear.test.mjs",
    "apps/ui/src/scene/gear-object.test.mjs",
    "apps/ui/src/scene/kiosk.test.mjs",
    "apps/ui/src/scene/pagoda-roof.test.mjs",
    "apps/ui/src/scene/station-labels.test.mjs"
  ],
  "decisions": [
    "All acceptance criteria covered: each role has headgear/prop/placement (H1-H4 tests verify placement and geometry); scarf takes station hue (existing test covers); scout has no lantern (L3 checks no headlamp:over); 400-tri budget tested; panda fur never tinted (material token test); Level 1 silhouette (bounding box tests); dev tablet prop (existing test covers); theme-live tinting (existing test covers).",
    "Designer's H1-H4 findings all have passing tests: H1 props point at camera (socket rotation tests), H2 pencil distinguishes roles (pencil tests), H3 noren clears hat tips (test checks 1.55 clearance), H4 hat positions at proper heights (position/rotation tests with near() tolerance 0.03-0.05 rad).",
    "The three test literal updates are NOT weakened assertions. Each uses the same assertion structure (Math.abs/.deepEqual) and tolerance; only the expected value changed (e.g., station-labels still does Math.abs(byStation.tea.y - 2.37) < 1e-9, same as before with 2.0). User's raised eave (1.4→1.77) flows through consistently.",
    "No specify tests removed or loosened. My 105 tests from b8895bd remain, now passing. Developer added 32 new tests at end of headgear.test.mjs (H1-H2, H4, M1, M3, L1-L3, H3) for design findings and M2 is deferred."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Designer re-render of Den at 1440x900 to check H1-H4 visual fixes (pencil behind ear, props upright, noren clears qa/security hats, spectacles/goggles/headlamp/cap at correct heights), then user verdict on visual polish scope (M2 scarf contrast deferred to later pass)",
      "owner": "designer"
    }
  ]
}
```

## Verdict

QA pass. All 1516 tests pass. Specify tests unchanged. Three literal updates correct expected values for the user's raised-eave decision without weakening assertions. All acceptance criteria mapped to passing tests.

## Criterion-to-test map (all criteria covered)

| Criterion | Test | Status |
|---|---|---|
| Each role has headgear, prop, placement | H1 socket rotation tests; H4 position tests; ROLE_PLACEMENT contract in panda-contract.mjs | pass |
| Scarf from station hue | Per-role scarf tinting tests (headgear.test.mjs, exists since b8895bd) | pass |
| Scout has no lantern | L3: "headlamp has no long antenna box over the crown" | pass |
| ≤400 tris per panda at crowd LOD | Per-role triangle budget test (headgear.test.mjs) | pass |
| Panda fur never tinted | "every part uses a station or neutral token, never a fur material" | pass |
| Reads at Level 1 zoom | Bounding box tests: "headgear stays within 1.6 x head width"; "douli widest, toque tallest" | pass |
| Dev tablet prop | "developer: the prop is the npm test tablet, a slab with a screen plane" | pass |
| Theme-live tinting | "a theme swap changes scarf hue, leaves neutrals alone" (exists since b8895bd) | pass |
| H1: props point at camera | "every prop is held upright: rotation turns +y to world up, face to camera" | pass |
| H2: pencil distinguishes roles | "architect wears pencil, product does not; parts have correct materials, sizes, position, tilt" | pass |
| H3: noren clears hat tips | "front-row noren hangs clear (bottom ≥1.55) of qa douli and security cap tips" | pass |
| H4: hat parts at design heights | Spectacles z 0.27, goggles z 0.21-0.25, headlamp z 0.22-0.33, cap brim z 0.38, toque/douli/beret/headphones centre z -0.15 | pass |
| M1: cream cup/plate 0.18 outward, ink-rimmed | "cream teacup and plate stand 0.18 outward; rims are ink-tinted" | pass |
| M3: headphone band raised | "headphone band 0.05 above cup centres (y ≥ -0.37)" | pass |
| L1: tablet red/green lines | "developer tablet has red failed line and green passed line (semantic colours)" | pass |
| L2: scarf tail forward | "scarf tail z ≥ 0.56" | pass |
| L3: headlamp no antenna | "headlamp has no :over part; all parts ≤0.4 tall" | pass |
| Designer critique, no high findings | human-verified: designer re-render scheduled | pending |
| User verdict | human-verified | pending |

## Notes

- All files changed are within ticket scope: headgear.mjs, headgear.test.mjs, gear-object (meshes), panda-contract (placement), Den.jsx (wiring), Market.jsx (theme hook), banquet-layout/kiosk/pagoda-roof/station-labels (roof geometry and dependent tests).
- M2 (scarf contrast) deferred to visual polish pass per orchestrator 2026-10-01.
- No console errors, no test skips, no syntax issues.
