# den-scene-v1/07 designer re-review: Design pass (F1, F2, F3, F7, m all fixed), one new medium finding at tablet widths

Build at a0fea6c (detached). `ui:build` passes, the page loads, the console is empty in all six captured views, no horizontal overflow at any of nine widths. Verdict: **Design pass**. The fixes are in place and look right in both themes. One new finding (N1) came out of the F1 fix: the intent placeholder is truncated between 600 and 709 px and between 900 and 925 px. It is small CSS; the user can decide whether to fix it in 07 or ticket it.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "designer",
  "mode": "review",
  "current_step": "Re-reviewed a0fea6c: F1, F2, F3, F7 and the m ruling pass. New medium finding N1 (intent placeholder truncated at 600-709 and 900-925 px). Design pass; ticket can go to the user's visual verdict.",
  "artifacts": [
    "apps/ui/src/styles.css:270-300 (zoom-switcher, intent widths, 899 and 599 media blocks)",
    "apps/ui/src/overlay/Bottom.jsx:56-84 (zoom steps, autonomy chip)",
    "apps/ui/src/overlay/Cards.jsx:92-107, 159 (Note chip, Ctrl+Enter, live region)"
  ],
  "decisions": [
    "F1 pass: no overlap among zoom switcher, intent bar, timeline and cards at 1440, 1280, 1024, 900, 899, 768, 600, 599 and 375",
    "F2 pass at 375 and 599: placeholder fits (171 px text in 178 px at 375); Ctrl K hidden; input 44 px at coarse pointer per CSS (code read)",
    "F3 pass: Gated chip is a dimmed, focusable aria-disabled button with a title and described-by reason; focus ring is visible (2 px solid). Kept as the orchestrator decided, so keyboard users reach the reason",
    "m ruling pass: m chip on the Note label, helper line 'Ctrl Enter denies with this note', Ctrl/Cmd+Enter handler guarded by canAct",
    "F7 pass: aria-live=polite on .needs-head, a node that persists across j/k",
    "N1 is not a regression of an acceptance criterion at the widths the ticket names (375, 1440); recommend fixing it in the same branch because it is two CSS rules"
  ],
  "failures": [
    "N1 intent placeholder truncated at 600-709 px (61 px available of 171 needed) and 900-925 px (145 of 171)"
  ],
  "pending": [
    {
      "item": "user: visual verdict on the 3D scene (my captures use lightenScene, so the scene reads washed); decide N1 fix-now or follow-up",
      "owner": "orchestrator"
    },
    {
      "item": "optional developer: N1 fix, N2 chip text contrast (targets below)",
      "owner": "developer"
    }
  ]
}
```

## Checked

Box measurements at nine widths (1440, 1280, 1024, 900, 899, 768, 600, 599, 375), screenshots at desktop 1440 light and dark, 1024 light, phone 375 light and dark, and 1440 with reduced motion (captured, console empty; the new CSS adds no animation or transition, so nothing new to check there). Computed focus outline on the autonomy chip, Note chip box and colour, helper line colour. Screenshots: scratchpad `shots2/` (d-light, d-dark, d1024-light, m-light, m-dark, d-reduced).

## Per finding

- **F1 pass.** Zoom switcher is now a vertical list, 125 x 148 at x 16 to 141 (the frame draws about 112; the extra 13 px is the switcher's 6 px side padding plus the +/- row, fine). Intent starts at x 430 at 1440, 350 at 1280, 252 at 1024 and 900: clear of the switcher and, at 1024 and 900, of the timeline (intent ends 772, timeline starts 788; at 900, 648 vs 664). Timeline is hidden at 899 and below; no overlaps at any width. Look: d-light.png, d-dark.png, d1024-light.png read as the approved frame.
- **F2 pass** at 375 (m-light.png, m-dark.png: full "Give the den an intent…" fits, Gated chip and Send stay) and 599 (402 px available).
- **F3 pass.** Chip reads "Gated", dimmed, `cursor: default`, focus ring `rgb(0,108,113) solid 2px` (same as the rest). One low note, N2 below.
- **m ruling pass.** In d-light.png and d-dark.png the `m` chip sits on the Note label next to the word (kbd 17 x 15, muted ink, 1 px ring), the helper line is under the field in the muted token (11 px, 6.3 light / 6.7 dark, same token as the other muted copy). It matches the `a` and `d` chips on the buttons.
- **F7 pass.** `aria-live="polite"` is on `.needs-head` (read from the DOM).

## New findings

**N1 (medium). Intent placeholder truncates at tablet-portrait widths.** The F1 fix sets `.intent` to `min(580px, 100vw - 288px)` under 900 and `100vw - 504px` from 900. With the chip (76), hint (50) and Send inside a 312 px bar at 600, the input gets 61 px: the placeholder reads "Giv". The same happens at 900 to 925 px (145 px of 171). Failing range: 600 to 709 and 900 to 925. Cause (confirmed, `styles.css:~277` and the 899 block). Fix targets: hide `.intent-hint` under 960 px (frees 58 px, covers 900 to 925), and under 900 px anchor the bar left of centre as `left: 160px; right: 16px; width: auto; transform: none` since the timeline is hidden there (at 600 the bar becomes 424 px and the input about 231 px, enough for 171). Check at 900, 768, 600.

**N2 (low). Gated chip text contrast.** The 0.55 dim on the whole chip puts "Gated" at roughly 3.4:1 in light (estimated from the computed colours; I did not render a pixel sample). Disabled controls are exempt from 1.4.3, but this chip is the only place the user can read the autonomy mode, so keep the text legible. Target: dim only the dot and border, and keep the text at the full `--ink` (at least 4.5:1), with the disabled look carried by the `title` and `cursor`. Optional; it can ride with den-scene-v1/13 when the real control lands.

## Unchecked

Real-scene frame quality (throttled capture), the 1440 reduced-motion view not looked at by eye (captured, no errors), Level 2 and 3 views, offline, empty and failed card states (qa's tests cover them), Ctrl+Enter behaviour in the browser (qa's 32 tests cover it; I read the handler only), screen-reader run, light/dark at 1024 and the 600 to 709 band by screenshot (measured only). F4 to F6, F8 and F9 were left out by the user's rulings and are not reviewed.

## Environment issues and failed calls

- Playwright's `chrome` and `msedge` channels are not installed (`Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`); it fell back to bundled Chromium via `buildLaunchOptions`. Known, tracked by organism-infra/100.
- Screenshot capture did not time out this round: I reused last round's `lightenScene` (frameDelayMs 600) script, adapted to this worktree. All six shots took under the 120 s timeout. No retries.
- One capture miss on my side: the Note-focus crop was clipped on the left (the card is at the right at 1440), so it shows the empty scene. I did not retry; the Note chip is visible in d-light.png.
