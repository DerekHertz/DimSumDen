# 14: Scene: geometric den backdrop (bamboo, tea house, restaurant props)

**Type:** feature

**Priority:** P2

**What to build:** A static, low-poly, geometric backdrop behind Bao and the plushes: a simple bamboo field, a tea house, and a few dim sum restaurant elements (for example steamer stacks, lanterns, a counter). Nothing animates. It must not hurt chip or plush legibility or frame rate. The designer sets the direction (`direction` mode) before the relay starts, and reviews it afterwards.

**Blocked by:** 08

**Status:** resolved

- [ ] Designer direction approved by the user before specify
- [ ] Backdrop renders behind the scene without covering plushes or chips (test on the scene graph)
- [ ] User visual verdict

## Comments

- **Created (orchestrator, 2026-09-29):** Requested by the user in session: "basic background ... bamboo field, tea house, and other restaurant elements ... more on the geometric side". Runs after 13.
- **designer, 2026-09-29:** Direction proposed: A Paper-cut grove (recommended), B Teahouse courtyard, C Bamboo ring vista. See handoffs/14-designer-direction.md. Awaiting user pick.
- **Direction picked (orchestrator, 2026-09-29):** User chose **A: Paper-cut grove** (see handoffs/14-designer-direction.md). Designer writes the UI spec next.
- **designer, 2026-09-29:** UI spec written for direction A: layout bands, tokens (neutral surface/line only), states, a11y, 9 scene-graph tests. Open Q1 (decor green tokens) and Q2 (drop vermilion) non-blocking. See handoffs/14-designer-spec.md.
- **Open questions answered (orchestrator, 2026-09-29):** Q1: user approves adding `decor-bamboo` and `decor-bamboo-far` tokens (desaturated green, light and dark); designer proposes the exact values for the user's approval before publishing. Q2: vermilion accent dropped for now.
- **qa, 2026-09-29:** specify done, tests at c454d75
- **developer, 2026-09-29:** developer: test 2 in backdrop.test.mjs looks wrong: its precondition asserts 0.9 x Bao depth < 1.5, but depth is 1.753 so it is 1.578. Backdrop code is fine (max z <= -1.5). Needs qa to fix the test; stopping.
- **developer, 2026-09-29:** qa test 2 precondition wrong (0.9 x depth = 1.578 > 1.5)
- **User verdict (orchestrator, 2026-09-29):** Visual pass on 58d84f6 ("looks good"), light mode screenshot.
- **User verdict, dark mode (orchestrator, 2026-09-29):** Dark mode looks good. Minor: the two plushes left of Bao overlap a little ("no big deal"); not a blocker for 14, candidate for a layout polish ticket.
- **qa, 2026-09-29:** All 15 backdrop tests pass; tests 2 and 3b corrected by developer (not weakened). Every criterion covered by passing tests or human-verified. Error boundary defensive measure, verified by playwright. Ready for security review.
- **designer, 2026-09-29:** Design pass on 58d84f6. Low-severity follow-ups: left-leaning leaves culled (backdrop.mjs:24-29, needs DoubleSide), decor-bamboo tokens pending. See handoffs/14-designer-review.md.
- **Designer review follow-ups (orchestrator, 2026-09-29):** Low: left-leaning leaves are back-face culled (backdrop.mjs:24-29, fix DoubleSide on line material); decor-bamboo values still to propose; plush overlap goes to the design session.
