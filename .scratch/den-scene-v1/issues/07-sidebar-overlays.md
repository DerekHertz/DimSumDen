# 07: Sidebar and scene overlays re-skin

**Type:** feature

**Priority:** P1

**Blocked by:** 05, den-iso-v1/01

**Status:** resolved

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Rebuild the right sidebar and the three scene overlays from the components the user marked as keepers in the old Level 1 frame. Match "Level 1 · Den (target)" on the zoom frames canvas.

## Sidebar (400px, `surface-200`), top to bottom

1. **Header:** "Dim Sum Den" in the display face, and a Live dot with the word "Live" in `qi`.
2. **Needs you:** the ApprovalCard. It has a `lantern-fill` top edge, and a panda portrait in a `lantern` ring. The eyebrow reads `Station · role · ticket`, the title is "<id> wants <action>", and a `code` preview well follows. Below are Approve (primary, key hint `a`) and Deny (key hint `d`), then one row per other waiting request, each with a relative time. Keys work as ApprovalCard specifies: `a`, `d`, `m`, `j`/`k`.
3. **Stations:** one pill per open station, in its hue, with its glyph, name and panda count, and "· waiting" in `lantern` when one waits. Then dashed "coming online" pills for dormant stations: Cubs shows "N asleep"; Drum and Library show "coming online". Clicking a pill zooms to that station.
4. **Queue:** "Queue", then "N ready · next 8 on the susan", then ticket rows with a `P0`–`P3` chip and title.

Remove the plan usage meter from the sidebar; it's on the Tally now (05).

## Overlays on the scene

- **Bottom-left, zoom switcher:** 1 · Den, 2 · Station, 3 · Panda, 4 · Workspace. The current level is in `qi`. Plus + and − buttons with `aria-label`s.
- **Bottom-centre, intent bar:** autonomy toggle (AutonomyControl compact), input with placeholder "Give the den an intent…", a `Ctrl K` hint and Send, with a "Current intent" pill above.
- **Bottom-right, timeline:** Live and the time, a scrub track with event dots, and "Drag back to replay the den's history".

**Files:** the sidebar/panel components in `apps/ui/src/` (find them with `rg "Plan usage"`), the chip or overlay layer, tests.

## Acceptance criteria

- [ ] Sidebar order: header, Needs you, Stations, Queue; no usage meter (DOM test)
- [ ] Approve/Deny respond to `a`/`d` when the card has focus; key hints are visible
- [ ] A station pill shows "· waiting" when any of its pandas is `waiting_on_user`
- [ ] Dormant stations render as dashed pills with "coming online" (Cubs: "N asleep")
- [ ] Zoom switcher labels are exactly: 1 · Den, 2 · Station, 3 · Panda, 4 · Workspace
- [ ] Intent placeholder is "Give the den an intent…"
- [ ] All controls are keyboard-reachable with a visible 2px focus ring; axe finds no serious issues
- [ ] Designer review pass at desktop and mobile widths, light and dark

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
- **orchestrator, 2026-10-01:** Scope added (user, 2026-10-01): free zoom as well as the level switcher: scroll wheel and pinch zoom between the Level 1 framing and close enough to read a panda's headgear, clamped so the camera never goes inside a kiosk or below the floor. The + and − buttons step the same zoom. Add a test for the clamp.
- **orchestrator, 2026-10-01:** Scope changed (user, 2026-10-01): the 400px sidebar becomes floating 320px cards over the scene, per the frame 'Level 1 · Den (isometric, floating cards)' (https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G) and docs/design/2026-10-01-iso-den.md (den-iso-v1/01). Read 'sidebar' as: logo pill top-left, a Needs you card and a Stations & queue card on the right (collapsible). Contents, keys (a/d/m/j/k), copy and the bottom overlays stand. The 'Sidebar order' criterion becomes: logo pill, Needs you, Stations & queue; no usage meter. Blocked by den-iso-v1/01.
- **developer, 2026-10-01:** WIP at usage wrap-up; see handoff 07-developer.md
- **orchestrator, 2026-10-01:** Wrap-up at 90% usage (2026-10-01). State: WIP on feat/floating-cards07 at 1105e00, status stays claimed (no lock). qa's tests: 22 of 25 green, 25 fixed not rerun, test 24 cannot pass as written (Tab walk starts at the clicked Stations header: qa to fix the test), test 18 (+/- clamp, 80 clicks) times out at 49 s, cause undiagnosed. NEXT: developer finishes: migrate tally-card-wiring, tally-expand, brand tests and apps/ci-cd/smoke-ui.mjs, add camera-store and overlay-model unit tests, run the full suite and smoke:ui, then qa verify. First send qa to fix test 24. Details in handoff 07-developer.md. Then 03 unblocks.
- **developer, 2026-10-02:** Done; see handoff 07-developer-2.md. npm test has one red: qa's floating-cards.test.mjs:579 has the bare word organ, tripping scripts/organ-to-station.test.mjs. qa to fix. Spec deviations for designer: Queue copy (3 rows, not 'next 8'), Stations card starts collapsed.
- **designer, 2026-10-02:** Design bounce: F1 zoom switcher overlaps intent bar at 1440 and below (stack vertically, narrow intent); F2 intent placeholder cut at 375 (hide Ctrl K under 600px); F3 autonomy chip does nothing (make read-only). Recommendations on the 4 deviations and m/j/k: handoff 07-designer-review.md.
- **designer, 2026-10-02:** Design bounce: F1-F3, see 07-designer-review.md
- **orchestrator, 2026-10-02:** Designer review (45debaa): design bounce. Must fix F1 (zoom switcher overlaps intent bar at ≤1440; stack zoom levels vertically, narrow intent bar, hide timeline <900px), F2 (375: placeholder cut, hide `Ctrl K` hint <600px; input 44px at coarse pointer), F3 (autonomy chip does nothing). See 07-designer-review.md. User rulings 2026-10-02: KEEP Stations card as built (3 rows, "N open · M ready"; criterion amended to match the approved frame); KEEP Stations collapsed by default; KEEP Note field and inline panda face. Autonomy: user wants the REAL control, not read-only (scope TBD, needs a bridge endpoint). Keys: a/d/j/k keep (j/k get aria-live); `m` = deny with message: focuses Note, shows `m` chip on the Note label, Ctrl+Enter in Note sends Deny with the note.
- **orchestrator, 2026-10-02:** Autonomy: real control split to den-scene-v1/13-autonomy-control (user). For 07, F3 = chip shows the mode but is disabled with a "coming soon" tooltip.
- **qa, 2026-10-02:** qa, 2026-10-02: Stations as built per user KEEP ruling, and what the tests assert: header summary 'N open · M ready', overline 'Next on the susan', up to 3 queue rows (P-chip + title), card closed by default. This supersedes 'What to build' item 4 ('N ready · next 8 on the susan', next 8 rows); the 'next 8 on the susan' chip on the scene is a follow-up ticket, not 07. Autonomy chip: shows mode, disabled with a coming-soon tooltip (real control: den-scene-v1/13). Tests: floating-cards.test.mjs, see handoff 07-qa-specify-fix2.md
- **developer, 2026-10-02:** Design bounce F1-F3 + m/j/k rulings fixed at a0fea6c; floating-cards 32/32, npm test 1695 pass, smoke:ui 10 pass. See 07-developer-3.md
- **qa, 2026-10-02:** QA pass (light verify, a0fea6c): npm test 1695/1695, 0 skipped; test file unchanged since b6ca207; all round criteria mapped. See 07-qa-verify-3.md.
- **designer, 2026-10-02:** Design pass at a0fea6c: F1, F2, F3, F7 and the m ruling verified (no overlaps at 9 widths, 375 placeholder fits, chip read-only with focus ring, m chip + Ctrl Enter helper, live region). New medium N1: intent placeholder truncated at 600-709 and 900-925 px (fix targets in 07-designer-review-2.md); N2 low: Gated chip text ~3.4:1. User decides N1 now or follow-up.
- **orchestrator, 2026-10-02:** Designer re-review passed F1, F2, F3, F7 and the m ruling. User decision: fix N1 (intent placeholder truncation 600–709px and 900–925px) in 07 now, as a short developer round then qa light verify. Not a bounce. N2 moved to den-scene-v1/13.
- **qa, 2026-10-02:** QA pass at f787331: npm test 1696/1696 twice, specify tests untouched, N1 covered by new placeholder-fit test. Details in 07-qa-verify-4.md.
- **orchestrator, 2026-10-02:** User ruling: the scene haze (filed as den-scene-v1/14) is fixed in 07 now; it has recurred several times. Likely cause: feat/floating-cards07 predates den-iso-v1/04's fog fix (6f04653, merged #129), so the branch still has the old grove fog. Fix round: merge origin/main into the branch (clean per merge-tree), confirm no haze at the default frame and across 07's zoom range, and explain the pale shape on Bao's head. 14 folds into 07.
- **developer, 2026-10-02:** Haze fixed by merging origin/main (den-iso-v1/04 fog 49/75; old branch had Fog 18/40 on a camera 40 units out). Pale head shape = orchestrator on Bao's Pass perch, was fogged; by design. Guard test added; npm test 1744, smoke:ui 10 pass. See 07-developer-5.md
- **orchestrator, 2026-10-02:** User verdict on dd3443a renders: haze gone. Mobile clipping (Blocked chip at 375, pad labels at zoom-in) not a concern for 07; no ticket for now. Proceed: qa light verify → risk-check → PR. den-scene-v1/14 resolves with 07's PR.
- **qa, 2026-10-02:** QA pass at dd3443a: npm test 1744/1744 on 2 of 3 runs (1 known Ctrl+Enter Note flake), specify tests untouched, merge left 07 overlay files byte-identical, fog-zoom-range test sound, haze criteria mapped. See 07-qa-verify-5.md.
- **security, 2026-10-02:** Security pass at dd3443a. No critical/high/medium. Low: apps/ui/src/overlay/Cards.jsx:166 agent title shown in a code well as a text node (long-title spoofing only). gitleaks clean, no dependency or CI changes. Detail in 07-security.md.
