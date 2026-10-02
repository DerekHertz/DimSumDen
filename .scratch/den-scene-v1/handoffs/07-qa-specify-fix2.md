# den-scene-v1/07 qa specify, fix round 2

Branch feat/floating-cards07, tests at b6ca207 (on top of 45debaa). One file changed: apps/ui/src/overlay/floating-cards.test.mjs. Run: `node --test apps/ui/src/overlay/floating-cards.test.mjs` (about 55 s). Result: 32 tests, 25 pass, 7 fail (all 7 new, each for a missing feature; no setup errors). scripts/organ-to-station.test.mjs passes 7/7 again.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Fixed the organ regex; added 7 failing tests for the user's rulings and the designer's F1/F2/F3/F7; committed b6ca207. Developer next.",
  "artifacts": [
    "apps/ui/src/overlay/floating-cards.test.mjs (b6ca207)",
    ".scratch/den-scene-v1/issues/07-sidebar-overlays.md (comment on the as-built Stations copy)"
  ],
  "decisions": [
    "Autonomy chip stays a button with aria-disabled=true, not the disabled attribute: the existing keyboard test requires no visible overlay control to be removed from the tab order, and a focusable chip lets keyboard users reach the 'coming soon' reason. Designer suggested a span; the user's ruling says 'disabled with tooltip', so the test accepts disabled or aria-disabled but not a changing mode",
    "Stations criterion: the ticket's criteria list has no copy criterion; 'What to build' item 4 still says 'next 8'. Added a board comment recording the as-built copy (no rewrite). Existing test 'summary and queue' already asserts the as-built copy",
    "Coarse-pointer test uses isMobile in Playwright (matches pointer: coarse; the test asserts that precondition)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "developer: make the 7 red tests pass; then run full npm test and smoke:ui; qa light-verifies (qa specified)",
      "owner": "developer"
    },
    {
      "item": "visual-only checks left to the designer re-review (below)",
      "owner": "designer"
    }
  ]
}
```

## Criterion-to-test map (this round)

| Ruling / finding | Test (floating-cards.test.mjs) | Fails now because |
| --- | --- | --- |
| Fix qa's regex (developer's one red) | accessibility basics test; `organ` removed (organism and organisms stay) | passes now |
| `m` chip on the Note label, helper "Ctrl Enter denies with this note" | "deny with message: the Note label carries an 'm' chip..." | no chip |
| Ctrl+Enter (and Cmd+Enter) in Note sends Deny with note; plain Enter files nothing; `m` focuses Note | "Ctrl+Enter in the Note sends Deny with that note..." | no POST |
| F7 j/k announced | "'j' and 'k' are announced...": title inside an aria-live region that is the same node after `j` | title not in a live region |
| F3 autonomy chip: shows mode, disabled, "coming soon" in title or aria-describedby, name not "Change", clicks change nothing | "autonomy chip shows the mode and is disabled..." | chip is live |
| F1 zoom/intent/timeline never overlap at 1440, 1280, 1024, 900; levels in one column stacked; switcher at most 150 wide; intent at least 360 and centred; timeline hidden at 899, 768, 600; zoom and intent clear at those widths; no horizontal overflow | "bottom overlays never overlap..." | zoom is 423 wide at 1440 and overlaps intent |
| F2 `Ctrl K` visible at 600, hidden at 599 and 375 | "Ctrl K hint hides under 600px..." | hint always shown |
| F2 placeholder fits the input at 375, input at least 44px at a coarse pointer | "phone 375 with a coarse pointer..." | placeholder needs 171px, input has 92px (the 44px assertion sits behind it: it surfaces once the placeholder fits) |

Existing tests that must stay green (unchanged): geometry at 1440 (zoom x 16, bottom 884; intent 580 wide centred; timeline 220), phone 390, keyboard walk (so the autonomy chip must stay focusable), a11y basics.

## Human-verified (cannot be tested here)

- Visual look: stacked zoom switcher matches the frame (about 112 wide), spacing and glass look, in light and dark.
- The `m` chip and helper line placement and styling on the Note field.
- Screen-reader announcement quality of the j/k live region (the test checks the region exists and persists, not what a reader says).
- Tooltip hover appearance for the autonomy chip.
- Designer re-review at 1440, 1280, 1024, 900 and 375 (the tests check boxes, not taste).

## Not covered, for the developer or designer to decide

- F4 (Send's reason via aria-describedby), F5 (eyebrow uppercase), F6 (tab order), F8 (station dot 16px), F9 (row wording): the designer marked these should-fix or low and the orchestrator did not scope them in, so no tests. Say the word and qa adds them.
- Real autonomy control: den-scene-v1/13.

## Failed calls

- None blocked. `node --test ... | grep` once printed no counts for the TAP-format run of organ-to-station.test.mjs (spec reporter greps differ); reran with `tail`, fixable friction.

Worktree: /home/dhertzell/dimsumden/.claude/worktrees/agent-a58d9eda1c82c522b, clean.
