# den-scene-v1/07 designer review: Design bounce (two layout fixes), recommendations on the four deviations

Build at 45debaa (detached). The page loads, the console is clean (d-reduced view), `ui:build` passes, no horizontal overflow at 1440 or 375. Verdict: **Design bounce**, because the zoom switcher collides with the intent bar at the spec's own 1440 width. The four deviations are mostly fine, see "Recommendations".

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "designer",
  "mode": "review",
  "current_step": "Reviewed desktop 1440x900 and phone 375x667, light and dark, plus reduced motion and keyboard. Verdict Design bounce: fix F1 and F2 (layout), plus the autonomy chip (F3). Recommendations on the four deviations and keys m/j/k written for the user to decide",
  "artifacts": [
    "docs/design/2026-10-01-iso-den.md section 4 (the spec the build follows)",
    "apps/ui/src/styles.css:268 (zoom-switcher), :276 (intent), :299 (phone)",
    "apps/ui/src/overlay/Bottom.jsx:56-84 (IntentBar)",
    "apps/ui/src/overlay/Cards.jsx:122-131 (card keys)"
  ],
  "decisions": [
    "Deviations 1 and 2 (3 queue rows, 'N open · M ready', Stations card closed) match the approved frame and iso-den section 4; the ticket's 'next 8' text predates the frame. Keep both",
    "Deviation 3 (local autonomy chip): keep a chip, change it to a read-only status, because it cycles to 'autopilot' with no effect on the den",
    "Deviation 4: keep the Note field (it migrates the old panel's gate note) and keep the logo-pill panda face as a stand-in for the Bao crop; wire the Note to `m` properly",
    "Keys: a and d stay scoped to focus inside the card; j and k keep; m changes to match ApprovalCard"
  ],
  "failures": [
    "F1 zoom switcher overlaps the intent bar (and the intent bar overlaps the timeline) at 1440 and below",
    "F2 intent placeholder is cut to 'Give the den' at 375",
    "F3 autonomy chip is a live-looking control that does nothing"
  ],
  "pending": [
    {
      "item": "developer: fix F1, F2, F3 (targets in the handoff body), plus the should-fix list if the pass touches those files; qa re-verifies",
      "owner": "developer"
    },
    {
      "item": "user: decide the four deviations and m/j/k from the recommendations below",
      "owner": "orchestrator"
    }
  ]
}
```

## Checked

Desktop 1440x900 light and dark (Needs you open, Stations closed and open), phone 375x667 light and dark (both cards), 1440 with reduced motion, widths 1280, 1024, 768, 600 (box measurements), keyboard walk (40 Tabs), a/d/m/j/k, contrast in both themes (computed, 30 text pairs), touch target sizes at a coarse pointer. Screenshots: scratchpad `shots/` (d-light, d-dark-stations, m-light, m-dark, m-light-stations, m-dark-needs).

## Findings, ranked

**F1 (high). Bottom overlays collide.** Zoom switcher is a horizontal pill 423 px wide (x 16 to 439); the intent bar is 580 px centred. At 1440 the intent bar starts at x 430, so they overlap by 9 px and the "−" button touches the bar's border (d-light.png). At 1280 the overlap is 89 px (intent starts 350), at 1024 it is 217 px and hides "3 · Panda" and the +/- buttons. The intent bar also overlaps the timeline below 1052 px (1024: intent ends 802, timeline starts 788; 768: 674 vs 532; 600: 584 vs 364). Cause (confirmed): `.zoom-switcher` is `display:flex` in a row, `styles.css:268`; the frame draws the four levels as a vertical list with +/- below (about 110 px wide, `level1-den-iso.png`). Fix: stack the levels vertically as drawn (width about 112, so the intent bar clears it from 864 px wide up); keep intent `width: min(580px, 100vw - 2 * 252px)` so it also clears the 236 px timeline, and under 900 px hide the timeline (as the phone does) and let the intent bar take `min(580px, 100vw - 2 * 144px)`. Check at 1440, 1280, 1024, 900.

**F2 (high, phone). Intent placeholder is truncated.** At 375 the field is 108 px wide, so the placeholder reads "Give the den" (m-light.png); the criterion is the full "Give the den an intent…". Cause: autonomy chip, `Ctrl K` hint and Send all stay. Fix: hide `.intent-hint` under 600 px (a phone has no Ctrl key); that frees about 55 px, enough for the full text at 14 px. Also raise `.intent-input` to `min-height: 44px` at `pointer: coarse` (measured 32 px).

**F3 (high, trust). Autonomy chip lies.** `Bottom.jsx:69` cycles supervised, gated, autopilot on click. Nothing reaches the den, so the chip can say "autopilot" while the den stays gated. Autonomy is the one setting a user must be able to trust at a glance. Fix: render the chip as a non-interactive status showing "Gated" (a `span`, not a button; no focus stop), with `title` and visually-hidden text "Autonomy controls arrive with the intent endpoint". Same treatment as Send.

**F4 (medium). Send's reason is hover-only.** `aria-disabled` plus `title` (`Bottom.jsx:80`) tells keyboard and touch users nothing. Add `aria-describedby` to a visually-hidden line ("Intents are not connected to the den yet"). Contrast is fine (5.05 light, 9.69 dark before the 0.55 dimming; disabled controls are exempt).

**F5 (medium). Eyebrow case.** `.eyebrow` is mixed case with 0.04em tracking (`styles.css:~224`); the spec's `overline` is uppercase 0.08em, the frame draws "TEA · QA · [TICKET]" uppercase, and the same card's "NEXT ON THE SUSAN" already is uppercase. Make `.eyebrow` use the same rule as `.ov`. Contrast is 6.32 light, 6.72 dark.

**F6 (low). Tab order.** Spec: cards, then scene chips, zoom, intent. Built: scene, Tally chip, three scene chips, then the cards (tab walk). Not a trap; reorder only if cheap.

**F7 (low). j/k are silent.** Pressing j changes the card title but nothing is announced. Put `aria-live="polite"` on `.needs-head`.

**F8 (low). Station dot 18 px, spec 16.** Invisible at a glance; keep, or set 16 if the file is open anyway.

**F9 (low). Other-request rows** read "04-review · merge"; the spec row is "<id> wants <action>" plus age. The fixture has no age, so the age column is unseen here.

## What passes

- Order, copy and labels: logo pill, Needs you, Stations & queue; no usage meter; "1 · Den / 2 · Station / 3 · Panda / 4 · Workspace" exact; Cubs "0 asleep", Library and Drum "coming online" dashed; "· waiting" in `lantern` on Steamers and Pantry; Needs you has the `lantern-fill` top edge, count pill, panda portrait in a ring, code well, Approve (qi-fill) and Deny with `a` and `d` chips.
- Contrast (computed, light / dark), every pair at or above 4.5: card title 15.94 / 13.24, summary 6.29 / 6.77, eyebrow 6.32 / 6.72, Approve 5.05 / 9.69, waiting text 5.50 / 9.10, dormant pill 6.32 / 6.73, queue title 15.86 / 13.33, Live badge 6.07 / 8.12, zoom current 6.07 / 8.12, intent label 6.29 / 6.77, caption 6.29 / 6.77. Lowest is 5.05 (Approve, light).
- Focus ring: every tab stop shows a solid 2 px outline at 2 px offset (the scene itself at -2 px offset, as before).
- Reduced motion: `styles.css:119` kills all animation and the chevron transition is cut; the 1440 reduced view opens the card with no slide.
- Phone: cards stack under the logo pill (left 16, width 343), one open at a time, zoom and timeline hidden, intent bar full width. Touch targets: all card, pill, button and zoom controls measure 44 px or more at a coarse pointer; the exceptions are F2's input and the three scene chips (22 to 38 px), which are the pre-existing scene chips, not this ticket.
- Keys: with focus in the card, `a` and `d` act; `j` shows "04-review wants merge approval", `k` goes back, `m` focuses the Note; typing "jk a d" in the Note does nothing else. Hints `a` and `d` are visible and `aria-hidden` with `aria-keyshortcuts` on the buttons.

## Recommendations on the four deviations (for the user to decide)

1. **Stations card copy and row count: KEEP.** The ticket's "Queue / N ready · next 8 on the susan" with 8 rows predates the frame. The approved frame and iso-den section 4 draw "5 open · 31 ready" in the header, the overline "Next on the susan" and up to 3 rows; the build matches that exactly. In the frame the "31 ready · next 8 on the susan" text is the chip on the susan itself, and the app has no such chip yet; if wanted, make that a follow-up ticket rather than growing 07. Amend the ticket's wording so it no longer contradicts.
2. **Stations card starts collapsed: KEEP**, desktop and phone. Section 4 says Closed. Opened, it is 348 px tall and covers the right half of the Front of House kiosk and cuts its "Needs you" chip to "Needs y" (d-dark-stations.png); the closed header still shows "5 open · 3 ready". Needs you opening by itself when something waits is the right asymmetry.
3. **Local autonomy chip, no AutonomyControl compact: KEEP a chip, CHANGE it to read-only** (F3). The frame draws a "Gated" chip on `surface-000`, so the look is right. There is no AutonomyControl component or bridge endpoint in the repo, so defer the real control to the ticket that adds the intent endpoint, and amend the criterion to say so.
4. **Note field and panda face on the logo pill: KEEP both.** The Note migrates the old panel's gate note (`noteCounter` in gates-model), so removing it would regress a working feature; ApprovalCard also lists "deny-with-message" as one of the three answers. The inline PandaFace stands in for section 4's "36 px round Bao-face crop on ink"; it reads well in both themes (light: panda on `ink`; dark: on the light `ink`). Follow-up: swap in the real crop and the plush portrait when an asset exists.

**Keys.** ApprovalCard says: `a` approve, `d` deny, `m` deny with message, `j`/`k` next/previous card.
- `a`, `d`: KEEP scoped to focus inside the card (the ticket criterion says "when the card has focus"; iso-den section 7 says global while the card is open and focus is not in a text field). Scoped is safer for an approval; the always-visible chips are fine because they sit on the buttons.
- `j`, `k`: KEEP, they match the component (they step through waiting requests and wrap); add F7's live region.
- `m`: CHANGE. Today it only moves focus to the Note and denies nothing, with no visible hint. Make `m` focus the Note, show an `m` chip on the Note label, and let Ctrl+Enter (or Cmd+Enter) in the Note send Deny with that note, with the helper line "Ctrl Enter denies with this note". That gives the component's "deny with message" in two steps instead of none.

## Unchecked

Offline, empty ("Nothing is waiting on you", "The susan is empty") and failed states (qa's tests cover them; I did not render them); the 3D scene itself (my captures throttled frames, so the scene reads washed; the overlay review is unaffected); phone light with reduced motion beyond the dark pair; screen-reader and axe runs (names read from code only); Level 2 and 3 zoom values (0.75, 0.55) the developer asked about; the 8 px card slide-in (code read only).

## Environment issues and failed calls

- Headless Chromium on SwiftShader timed out a screenshot at 30 s with real draws; I re-ran with `lightenScene` at `frameDelayMs: 600` and a 120 s screenshot timeout. Known (organism-infra/94); the full-quality scene look stays the user's visual verdict.
- No browser pane tool in this cell: I drove Playwright from scratchpad scripts (`capture.mjs`, `probe.mjs`) against the bridge fixture. Playwright's `chrome` and `msedge` channels are not installed locally; it fell back to bundled Chromium.
