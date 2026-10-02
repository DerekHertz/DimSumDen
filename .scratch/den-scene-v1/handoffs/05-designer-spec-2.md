```json
{
  "ticket": "den-scene-v1/05-tally-abacus",
  "cell": "designer",
  "mode": "spec",
  "current_step": "Spec addendum for the expanded Tally view written (this handoff); ticket comment points here; ready for qa specify to extend tests",
  "artifacts": [
    ".scratch/den-scene-v1/handoffs/05-designer-spec-2.md"
  ],
  "decisions": [
    "Expanded view = non-modal dialog card floating over the scene above the Tally pill, not a camera zoom and not a modal",
    "05 moves the Dashboard charts out of the sidebar Pipeline slot into the expanded view; 05 keeps the sidebar usage meter slot (07 removes it)",
    "While open, the expanded usage rows are the only role=meter elements; the hidden ChipLayer twins are removed from the accessibility tree",
    "Pill label stays 'Tally: open the dashboard' and gains aria-expanded and aria-controls"
  ],
  "failures": [
    "Design system artifact (claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j) returned 'artifact not found' to this session; tokens were taken from docs/design/tokens.json and apps/ui/src/styles.css instead"
  ],
  "pending": [
    {
      "item": "Extend failing tests: replace the 'click and Enter open the dashboard without page scroll' criterion with the expanded-view criteria in section 9 below",
      "owner": "qa"
    },
    {
      "item": "User to confirm at verdict: dialog card placement, and that Pipeline leaves the sidebar in 05",
      "owner": "orchestrator"
    }
  ]
}
```

State: done (designer spec addendum). No code, no commits. Base 9eadf0c.

# 05 designer spec, addendum 2: the expanded Tally view

Scope change (user, 2026-10-01): clicking the Tally, or pressing Enter on it, expands it into a larger in-place view of the metrics instead of scrolling the sidebar to the dashboard. This addendum specs that view only. Everything in `05-designer-spec.md` stays: abacus geometry, bead count rule, tokens, scales, states, the hidden meter twins in the closed state. Where this addendum replaces something, it says so.

Token source: the design system artifact could not be read this session, so token names below come from `docs/design/tokens.json` and `apps/ui/src/styles.css`. Every name used exists in tokens.json. `--shadow-panel`, `--dur-base` and `--station-steamers` are in tokens.json but not in styles.css yet; the developer adds the CSS vars (the `dur-base` gap was already flagged in spec 1).

## 1. What replaces what

- Replaces the criterion "Click and Enter on the Tally open the dashboard without page scroll". New criterion: click, Enter or Space on the Tally pill, or a click on the abacus in the scene, opens the expanded view in place. Nothing scrolls: not the document, not `.panel`.
- Replaces App.jsx `openDashboard` (counter plus scroll-and-focus effect, lines 60-70) with open state: `tallyOpen`, `openTally`, `closeTally`, `toggleTally`. The scroll effect is deleted.
- The pill's `onOpenTally` becomes a toggle. A click on the abacus mesh only opens (a no-op when already open), so a stray click on the 3D object never closes the view.

## 2. What it shows

One card, top to bottom. Surface `surface-200`, 1px `line` border, `radius-l`, `shadow-panel`, padding `space-4`, `space-5` between sections.

1. **Header row.** "Tally" in `--font-display` 28/32 (same as the panel h1), left. Close button right: a 36px square, 44px at phone width, an x glyph, `aria-label="Close Tally"`.
2. **"The rods" section** (h3, heading style `heading`). Five rows in abacus order: 5 h, Week, Served, Tokens, Spills. Row grid: label 72px, then a strip of ten beads, then value text right-aligned, min 96px. Row min-height 40px.
   - Strip: ten circles 16px (12px at phone width), packed as on the abacus: uncounted left, counted right. Counted fill: `qi` (5 h, Week, Served), `station-steamers` via `stationHue('steamers', theme)` (Tokens), `alarm` (Spills; and 5 h/Week when value > 95). Uncounted: transparent fill with a 1px `line-strong` border (graphics need 3:1 against `surface-200`). Counted beads also get the 1px border in their own colour, so position is a cue as well as colour.
   - 80% mark on the 5 h and Week strips only: a 2px `lantern-fill` tick, 20px tall, in the gap between bead 2 and bead 3 from the left (8 counted beads sit to its right), the same boundary as the abacus tick.
   - Value text (`body-strong`): 5 h `79%`; Week `41%`; Served `6 tickets` (`1 ticket`); Tokens `84k / ticket` (reuse `tokenText`); Spills `0.3 / ticket`.
   - Usage status text after the value, `small`: `Wind down` in `lantern` at >= 80, `At limit` in `alarm` at >= 95. This is the text the sidebar meter used to give (`usageMeterModel` statusText), so nothing is lost when 07 removes it.
   - Under the usage rows, one line `small` in `ink-muted`: `Sampled 12 min ago`. Add a `sampledText` field to `usageMeterModel` (today it is folded into `secondary` with the weekly figure, which is now its own rod).
   - Caption under the section heading, `small` `ink-muted`, wording unchanged from spec 1: "Tally rods: Served 1 bead = 1 ticket this window; Tokens 1 bead = 20k per ticket; Spills 1 bead = 0.1 per ticket." It moves here from under the Pipeline heading.
3. **"Pipeline" section** (h3). The existing `<Dashboard>` component, unchanged: the three charts (tickets resolved per window, tokens per ticket by cell type, incidents per ticket by tool), their hidden tables, and the `role="alert"` error line with Retry. Single column; the SVGs already scale to width.

Both sections use the same model values as the abacus (same `usage` object, same `dashboardModel`), so card and abacus never disagree.

## 3. Placement and size

- Rendered inside `.scene`, as a sibling after `ChipLayer`, `position: absolute`, `z-index` above the chips, `pointer-events: auto`.
- It floats **above the Tally pill**: bottom edge 8px above the pill's top, horizontally centred on the pill and clamped to the scene's bounds with a `space-4` margin each side. The abacus and the pill stay visible beneath it (the beads keep showing the live counts), which is what makes it read as "the Tally, larger".
- Width `min(480px, sceneWidth - 32px)`. Height is content height up to the room above the pill minus 8px minus `space-4`, with a floor of 280px (enough for the header and the five rods). If even 280px does not fit above the pill, pin the card's top at `space-4` and let it cover the pill; Esc and the Close button still work.
- Bottom coordination with 07: the card's maximum bottom edge is `sceneHeight - var(--scene-bottom-inset, 0px)`. 05 reads the variable with a 0 fallback; 07 sets `--scene-bottom-inset` on `.scene` to the height of its bottom overlays plus `space-4`. No code coupling.
- The body below the header scrolls inside the card (`overflow-y: auto`, `overscroll-behavior: contain`). The scroll body is `tabindex="0"` with `role="region"` and `aria-label="Tally metrics"` so keyboard users can scroll it when no control inside is focusable.
- Position is computed once when it opens and again on scene resize. It is not tracked per frame, so it does not jitter if the camera eases.

## 4. Open and close

Open: click, Enter or Space on the pill; click on the abacus mesh.

Close: Esc (while focus is inside the card or on the pill, plus a document-level Esc while the card is open); the Close button; the pill again; a pointerdown anywhere outside the card and the pill (the scene canvas, another chip, a 07 overlay or the sidebar). That last rule also covers any camera move started by pointer. The card also closes if the camera leaves Level 1 (zoom switcher levels 2-4, a station pill) or the pill becomes hidden because its anchor left the screen; in that case focus is not forced back.

Outside-pointer close does not steal focus: the click target keeps its normal focus behaviour. Esc, Close and the pill return focus to the pill.

Live data while open: values and beads update in place with no layout jump and no announcement (no `aria-live`). Row heights are fixed so a value change never moves the layout. Strips snap; only the 3D abacus beads slide, and only on a count change, as in spec 1. Opening the card never triggers a bead slide.

## 5. Focus and keyboard

- Pill: still a native `<button class="chip chip-tally">`, the only tab stop for the Tally. `aria-label` stays "Tally: open the dashboard" (existing tests pin it). Add `aria-expanded` and `aria-controls` pointing at the card, and `aria-haspopup="dialog"`. While open it takes the same 2px ring treatment as `.chip[aria-pressed="true"]`.
- The card: `role="dialog"`, `aria-modal="false"`, `aria-labelledby` its "Tally" heading. Non-modal: the scene stays interactive for mouse, and Tab can leave the card in either direction.
- On open, focus moves to the "Tally" heading (`tabindex="-1"`, same pattern as the old `h-dashboard`), with `preventScroll`. Tab order inside: Close, then the scroll region, then Retry when the error line shows.
- Space on the pill must not scroll the page: the native button handles it; the developer must not add a keydown handler that skips `preventDefault`.
- **Gotcha:** `CameraRig.jsx:42` listens for `keydown` on `<main>`, and the card sits inside `<main>`. Arrow keys, + and - pressed inside the card would pan and zoom the camera. The card must `stopPropagation()` on `keydown` (or sit outside `main`). Esc is handled in the card's own handler before it stops propagation.
- Focus ring: global `:focus-visible` (2px `focus-ring`, 2px offset) on the Close button, scroll region and Retry. The ring must not be clipped by the card's `overflow`; give the scroll body 2px of padding.

## 6. Motion

- Open, desktop: opacity 0 to 1 and scale 0.94 to 1 over `dur-base` (240ms) with `ease-soft`, `transform-origin` at the pill's anchor point (bottom centre of the card). Close: reverse over `dur-fast` (160ms).
- Reduced motion: no scale, no translate. Opacity only, over `dur-fast`, which is what the global rule in `styles.css:105-107` already does; also apply `transition: none` to the transform. The card just appears.
- No animation on live value changes inside the card.

## 7. Phone width (scene width <= 640px)

- The card becomes a bottom sheet: full scene width, bottom-anchored (above `--scene-bottom-inset`), `max-height: 85%` of the scene (use `dvh` units if the container is the viewport), `radius-l` on the top corners only, `space-4` side padding.
- Open motion: translateY 24px to 0 plus opacity over `dur-base`; reduced motion is opacity only.
- Close button 44px. Bead strips 12px beads. Rows may wrap the value text under the label if the row is under 320px.
- It covers the abacus, and that is fine at this width; the pill is not needed to close it.
- Caveat: `.shell` has `min-width: 1280px` today, so the phone layout cannot actually render until 07/10 land. Implement with `@media (max-width: 640px)` on the card's own rules so it is correct as soon as the shell allows it. qa can pin the CSS rule in a unit test; visual check at 375px waits on the shell.

## 8. States

| State | Behaviour |
|---|---|
| Closed | Pill collapsed (`aria-expanded="false"`); two hidden `role="meter"` twins in ChipLayer as in spec 1 |
| Open | Card shown; `aria-expanded="true"`; the ChipLayer twins are removed from the accessibility tree (`aria-hidden` or not rendered); the two usage rows in the card are the only `role="meter"` elements (aria-valuemin 0, aria-valuemax 100, valuenow v, aria-label "5-hour window 79%" / "Week 41%") |
| No usage sample | 5 h and Week rows: strips all uncounted, value "not sampled", meter aria-label "5-hour window not sampled", no valuenow, no status text, no "Sampled" line |
| Metrics loading (no data yet) | Served/Tokens/Spills value text "no data", strips uncounted; charts show the existing "No data yet" |
| Metrics error | Value text "unavailable" on those three rows; the existing `role="alert"` "Metrics unavailable" with Retry in the Pipeline section; the 5 h and Week rows are unaffected |
| Value over scale | Clamps at 10 beads; value text shows the real value |
| Light and dark | All colours are tokens that already switch; bead hues follow the live system theme (as 02); card has `shadow-panel` in each theme's value |
| Reduced motion | Section 6 |

Non-usage rows (Served, Tokens, Spills) are not meters: plain text rows, strips `aria-hidden`. Usage rows are meters whose children are presentational.

## 9. Accessibility (WCAG 2.1 AA)

- Colour is never the only cue: counted beads sit right, uncounted left; wind-down and at-limit have text; values have text.
- Contrast: all text is `ink` or `ink-muted` on `surface-200`; `lantern` and `alarm` are the text-safe values; bead graphics against `surface-200`: `qi` and `station-steamers` pass 3:1 in both themes, uncounted beads have the `line-strong` outline.
- Targets: Close 36px desktop, 44px phone; pill unchanged.
- Dialog named by its heading; scroll region named; hidden chart tables unchanged.
- No focus trap (non-modal), no focus loss: Esc, Close and the pill return focus to the pill.
- Screen reader order on open: dialog "Tally", the five rods, "Pipeline" charts.

## 10. Interaction with 07 (sidebar and scene overlays)

- 07 removes the plan usage meter from the sidebar. After 07 this card is the only place with the exact 5 h and Week percentages, status text and sample age; that is why section 2 carries them. 05 must not remove the sidebar usage slot; 07 does.
- 07's sidebar list (header, Needs you, Stations, Queue) has no "Pipeline" section, so the charts' only home after 07 is this card. Decision: **05 moves the Dashboard into the card now** and removes the sidebar "Pipeline" slot plus the scroll-to-heading effect. Mounting `<Dashboard>` in both places would duplicate the chart `id`s (`chart-title-*`, `chart-desc-*`) and break axe, so it cannot stay in both. If the orchestrator would rather keep the slot until 07, the card must render the charts without duplicate ids; I recommend moving.
- 07's bottom overlays (zoom switcher, intent bar, timeline): the card sits above the pill, so it normally clears them. The `--scene-bottom-inset` variable (section 3) keeps it off them when the pill is low on screen. At phone width the sheet sits above that inset.
- 07's zoom switcher and station pills close the card (section 4). 07 needs no code for this; the card watches the camera level.
- 07's key hints (`a`, `d`, `m`, `j`, `k` on the ApprovalCard) are card-scoped, so they do not fire inside the Tally dialog.

## 11. For qa: criteria to map to tests

1. Click, Enter and Space on the pill open the dialog; `aria-expanded` is `true`; focus is on the "Tally" heading; `document.scrollingElement.scrollTop` and `.panel` `scrollTop` are unchanged.
2. A click on the abacus mesh opens it and does not close it when already open.
3. Esc, the Close button and the pill each close it and return focus to the pill; an outside pointerdown closes it and does not move focus to the pill.
4. Exactly two `role="meter"` elements exist when closed and exactly two when open (the open ones are in the card).
5. The card's five rows are in order 5 h, Week, Served, Tokens, Spills; counted-bead counts equal the spec 1 rule for fixtures (0, 79, 96, 100, over-scale); the 80% tick appears on the 5 h and Week rows only.
6. Unsampled, loading and error states give the strings in section 8; error keeps the Retry button.
7. Arrow keys, + and - pressed inside the card do not change the camera.
8. Reduced motion: no transform transition on the card; opacity only.
9. The sidebar has no "Pipeline" slot and the `<Dashboard>` is mounted once; the sidebar usage slot is still present.
10. A rule at `max-width: 640px` gives the sheet layout.

## Gotchas

- `CameraRig.jsx:42`: `keydown` on `main` (section 5).
- `App.jsx:60-70`: the scroll effect goes; `onOpenTally` is passed to both `Den` and `ChipLayer`, so both call sites change.
- `.shell { min-width: 1280px }` (`styles.css:87`): phone width cannot render yet.
- Spec 1's note on "without page scroll" is superseded and no longer needs a qa clarification.

Suggested skills: organism-protocol, tdd.
