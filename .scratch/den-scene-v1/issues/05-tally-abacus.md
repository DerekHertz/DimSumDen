# 05: Tally abacus with plan-usage rods

**Type:** feature

**Priority:** P1

**Blocked by:** 01

**Status:** resolved

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Replace the stone stele with a wooden suanpan abacus that also carries plan usage. This removes the need for a usage meter in the sidebar (07 removes it).

- Frame about 1.1 wide × 1.4 tall on short legs, in wood with dark rods and a warm paper backing. It stands at `TALLY` (set in 01) and faces the camera.
- Five rods, top to bottom, each with a sans label at its left end: **5 h**, **Week**, **Served**, **Tokens**, **Spills**. The heading "Tally" is in the display face.
- Ten beads per rod, one bead per tenth of the rod's scale. Usage rods scale 0–100%. For Served, Tokens and Spills, reuse the scale the tally face view-model already uses; if it has none, use "this 5-hour window" and state the scale in the dashboard.
- Counted beads slide right in the rod's colour: `qi` for 5 h, Week and Served, `station-steamers` for Tokens, `alarm` for Spills. Uncounted beads stay wood.
- The usage rods get an 80% mark on the frame in `lantern-fill`. Past 95%, their counted beads turn `alarm`.
- Usage comes from the same source as today's sidebar meter (`usage.jsonl` through the bridge).
- Accessibility: the `Tally` pill above the frame opens the dashboard on click or Enter ("Tally: open the dashboard"). Each usage rod is exposed as `role="meter"` with an `aria-label` like "5-hour window 79%", using the chip layer or a visually hidden DOM twin. Exact values live in the labels and the dashboard.
- Beads slide over `dur-base` only when a count changes. With reduced motion they jump.
- The code can keep the `Stele`/`tally-stele` names; rename is optional. Remove the stone geometry.

**Files:** `apps/ui/src/scene/TallyFace.jsx`, `tally-face.mjs`, `Market.jsx` (or wherever the stele mounts), tests (`tally-stele.test.mjs`, `tally-face.test.mjs`).

## Acceptance criteria

- [ ] Five labelled rods in order: 5 h, Week, Served, Tokens, Spills
- [ ] Counted-bead count = round(value / scale × 10) per rod (unit test with fixtures, including 0 and 100%)
- [ ] Usage rods at 79% show 8 counted beads and an 80% mark; at 96% the counted beads use `alarm`
- [ ] The 5 h and Week rods read the same values as the current usage source
- [ ] Each usage rod has `role="meter"` with the exact % in its accessible name
- [ ] Click and Enter on the Tally open the dashboard without page scroll
- [ ] No stone stele geometry remains; user visual verdict

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
- **orchestrator, 2026-09-30:** Design sweep (designer, user-approved 2026-09-30): Scope added: low-poly first (box frame, cylinder rods, sphere beads).
- **designer, 2026-10-01:** UI spec (designer, 2026-10-01). LAYOUT: abacus group at TALLY (x 1.8, z 3.0, rotationY kept). Low-poly: frame of 4 boxes, outer 1.1 w x 1.4 h x 0.12 d, bar 0.08; two box legs 0.08 x 0.15 tall so frame bottom sits at groundY+0.15; paper backing plane inset 0.02 behind rods; heading band at top 0.22 tall with 'Tally' (Long Cang / --font-display); 5 cylinder rods (r 0.012) spaced evenly in the remaining height, top to bottom 5 h, Week, Served, Tokens, Spills; sans label (--font-sans 600) on the paper at each rod's left end, label column 0.28 wide; beads = 10 low-poly spheres (or squashed 8-seg spheres) r 0.035 per rod on the bead span right of the label column. Uncounted beads rest packed left, counted beads packed right (count from the right end). 80% mark: thin lantern-fill box tick on the frame top and bottom bar edges of the 5 h and Week rods only, at the boundary between bead 8 and 9 from the left as counted from the right end (i.e. 8 beads to its right). Remove plinth/tablet/canvas-chart geometry; update tallyAnchor so the pill sits ~0.27 above the frame top. TOKENS: qi (5 h, Week, Served counted beads); station-steamers via stationHue('steamers', theme) (Tokens); alarm (Spills; and 5 h/Week counted beads when value > 95); lantern-fill (80% mark); --rice-paper (backing); --font-display / --font-sans; dur-base 240ms with ease-soft for the slide. Wood (frame, legs, uncounted beads) and rod colour have no token yet: use scene literals wood #8A5A34, wood-deep #4A2E1C (rods, frame shadow) like the existing stone literals; proposed tokens wood/wood-deep in handoff, not blocking. Theme: bead colours follow the live system theme (light/dark token values) as station hues do (02). COUNT: beads = clamp(round(value/scale*10),0,10). Scales: 5 h and Week 0-100%. The face view-model has no absolute scale (bars are relative to max), so per ticket: Served = tickets resolved in the latest throughput window, scale 10 (1 bead = 1 ticket); Tokens = mean perTicket across tokensByCell, scale 200k (1 bead = 20k); Spills = sum of incidentsByTool perTicket, scale 1.0 (1 bead = 0.1). Dashboard shows one caption under its heading: 'Tally rods: Served 1 bead = 1 ticket this window; Tokens 1 bead = 20k per ticket; Spills 1 bead = 0.1 per ticket.' STATES: no usage sample -> 5 h/Week rods all wood, no alarm, meter aria 'not sampled'; metrics missing/error -> Served/Tokens/Spills all wood, scene unchanged otherwise; value > scale clamps at 10. Reduced motion: beads jump, no tween. Slide only on count change, never on mount or re-render. INTERACTIONS/COPY: click on any abacus mesh opens dashboard (existing openDashboard, no page scroll); Tally pill label 'Tally', aria-label 'Tally: open the dashboard', Enter/Space open. A11Y: visually hidden DOM twin in ChipLayer: two elements role=meter, aria-valuemin 0, aria-valuemax 100, aria-valuenow v, aria-label '5-hour window 79%' and 'Week 41%' (unsampled: aria-label '5-hour window not sampled', no valuenow). Not focusable (pill is the only tab stop). Counted vs uncounted differ by position as well as colour, so colour is never the only cue. Usage reads the same usage object as usageMeterModel (fiveHour, weekly). 07 removes the sidebar meter; 05 must not.
- **orchestrator, 2026-10-01:** Scope changed (user, 2026-10-01): clicking (or Enter on) the Tally expands it into a larger in-place view of the metrics, rather than scrolling down the sidebar to the dashboard. Replaces the 'opens the dashboard without page scroll' criterion; the designer spec needs an addendum for the expanded view.
- **designer, 2026-10-01:** Spec addendum (designer, 2026-10-01): expanded Tally view is a non-modal dialog card above the pill (rods with exact values, plus the three charts moved from the sidebar Pipeline slot). Full spec and qa test list in handoffs/05-designer-spec-2.md. Supersedes the 'open the dashboard without page scroll' criterion.
- **designer, 2026-10-01:** spec addendum published
- **orchestrator, 2026-10-01:** Scope added (user, 2026-10-01): move the Pipeline charts out of the sidebar into the expanded Tally card in 05 (designer spec-2); remove the sidebar Pipeline slot and the scroll-to-dashboard effect. The usage slot stays for 07 to remove.
- **orchestrator, 2026-10-01:** Design refs moved (user, 2026-10-01): the shared originals aren't readable by cells. Use the user's copies: design system https://claude.ai/artifact/SCTwbsRq3wEcoYbiYYUUK7 (read project/README.md and project/tokens.json via Artifact read with path), zoom frames https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G.
- **qa, 2026-10-01:** qa specify: tests at 689ae1f on feat/tally05; all criteria mapped (see handoffs/05-qa-specify.md). human-verified: abacus visual verdict (wood, proportions, slide feel), 375px phone view, dark-theme beads, card closing on camera level change (07).
- **orchestrator, 2026-10-01:** Scope decisions on qa specify's flags (orchestrator, 2026-10-01): (1) roam.mjs:18 reads TALLY.plinth; the developer updates it to TALLY.frame. (2) Scope added: update apps/ci-cd/smoke-ui.mjs:127-130, which selects the removed [data-slot=dashboard], to target the Tally card so smoke:ui stays green. (3) Keep the test 'a quiet den does not block the pill': the pill is how the card opens, so the quiet-den caption must not cover it.
- **qa, 2026-10-01:** All 1446 tests pass, npm run smoke:ui passes, qa specify tests unchanged (brand.test.mjs edit justified per spec-2). Every acceptance criterion covered by passing test or human-verified. Ready for security review.
- **qa, 2026-10-01:** QA verify complete, handoff published, verdict recorded
- **orchestrator, 2026-10-01:** User verdict (2026-10-01): the user inspects 05 visually themselves; no designer review, to save usage. qa light verify passed (1446 tests, smoke:ui 6/6). Risk-check hit two test files (false positives on board and network wording); security runs once over 05 and 09 together. Then PR, merge on green, then the user's visual verdict. Developer flags to check: no 160ms close animation (spec-2 section 6), close on camera level change waits for 07, small abacus labels, wood and wood-deep tokens proposed, brand.test.mjs edited to allow .tally-card h2 in Long Cang.
- **security, 2026-10-01:** Security pass. No deps/lockfile change, gitleaks clean, no network/innerHTML/eval, no CSP or .github change; smoke-ui.mjs edit is selector-only. risk-check hits are false positives. See handoffs/05-security.md.
- **orchestrator, 2026-10-01:** User visual verdict (2026-10-01): 05 looks good. PR 117; merge on green.
