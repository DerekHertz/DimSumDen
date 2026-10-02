# 04: Scene dressing: stepping stones, dormant pads, bamboo

**Type:** feature

**Priority:** P2

**Blocked by:** 02

**Status:** in-review

**Design refs:** `docs/design/2026-10-01-iso-den.md` (placements; written by 01), `.scratch/den-iso-v1/spec.md`, `docs/design/den-map.md`.

## What to build

The den gains the frame's dressing: a ring of stepping stones around Bao, dashed dormant pads for the Library and the Drum (roles not online yet, labelled "coming online"), and bamboo borders on the left and right edges. All are placed by the layout module, so the den-map checks keep working. Pandas still never stand on open grass.

**Files:** `apps/ui/src/scene/banquet-layout.mjs`, `apps/ui/src/scene/Den.jsx`, `apps/ui/src/scene/Backdrop.jsx`, `apps/ui/src/scene/banquet-layout.test.mjs`.

## Acceptance criteria

- [ ] The layout module places the stone ring with the digest's count and radius around Bao (pure test)
- [ ] Library and Drum pads exist at the digest's positions and are dashed and labelled "coming online" (test on the layout and the label)
- [ ] No stone, pad or bamboo covers a kiosk's sign or counter at the default frame (geometric test)
- [ ] The pads carry no biology word in any label or `aria-label`
- [ ] The user inspects the den in the browser and says it matches the frame (visual verdict)

## Comments
- **developer, 2026-10-01:** 25 qa tests green; horseshoe 1.8 tabletop test red, needs ruling
- **developer, 2026-10-01:** horseshoe test now compares true outlines per user ruling; npm test 1671/1671, smoke:ui green
- **qa, 2026-10-01:** All tests pass (1671/1671, smoke:ui 10/10). Horseshoe test change reviewed: correctly implements user ruling (depth-aware outline check, radius 1.8 and +-3.0 kept, all else strict, not vacuous). All criteria mapped to passing tests. Ready for next stage or merge.
- **orchestrator, 2026-10-01:** Scope added (user, 2026-10-01): at the default frame the whole scene must be clear of fog. The ortho camera sits 40 units from the target but grove.mjs groveFog is Fog(grove-mist, 18, 40), so everything is at or past full fog (user screenshot: kiosks and backdrop washed out, only Bao clear because he ignores fog). Set fog for the 40-unit camera: no fog on anything in the market, Bao, kiosks, Tally, hamper or pads at the default frame and at both zoom-range ends, light mist only on the far grove. Add a test comparing camera-to-object distance with fog.near (grove.test.mjs 'starts beyond the market' pins near >= 16 for the old camera). Check the whole scene is visible after the fix.
- **developer, 2026-10-01:** fog fixed, Dressing recursion fixed; npm test 1673/1673; smoke:ui not rerun
- **orchestrator, 2026-10-01:** Wrap-up at 90% usage (2026-10-01). State: feat/scene-dressing04 at 6f04653, npm test 1673/1673, qa verified ef7d73a only. NEXT: (1) light qa re-verify of 6f04653 (new: fog 49/75 distance test, Dressing self-render bug fixed, Bao fog hack removed); smoke:ui not rerun; (2) risk-check; (3) PR and merge on green. User asked to check at 1440x900: Library/Drum pad chips are partly hidden behind the Steamers chips and the mound, and the bamboo clusters blend into the dense grove, so the dashed pads are hard to see. Also note the Dressing bug (nothing drawn) passed qa verify at ef7d73a: add a rendered-scene check.
