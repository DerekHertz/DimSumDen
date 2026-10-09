```json
{
  "ticket": "den-v1/09-demo-mode",
  "cell": "designer",
  "mode": "spec",
  "current_step": "Spec final and signed off by the user (2026-10-08, mockup and defaults). Copy the spec below into the ticket, then qa specify.",
  "artifacts": [
    {"path": "https://claude.ai/artifact/6hzqB87i5AH4qcLBt5MNHB", "note": "Static mockup: live entry state, playing light with pending approval, playing dark with message ack, phone 375px."}
  ],
  "decisions": [
    "Indicator: neutral 'Demo' badge replaces the Live badge in the logo pill, plus a slim top-centre strip (user)",
    "Entry/leave control: outline button under the logo pill, 'Watch the demo' / 'Leave demo' (user)",
    "Greyed reason stays 'Demo mode: actions are off' (already shipped for T, A, D; ticket wording 'Demo mode' superseded) (user)",
    "No keyboard shortcut for leaving; button and URL only (user)",
    "Defaults accepted: toggling exits walk mode and closes panels; URL changes without reload; strip hidden under 900px; polite announcements (user)"
  ],
  "failures": [],
  "pending": [
    {"item": "Copy spec into ticket; qa specify maps criteria to tests against the replay driver and a stub bridge client that fails on any call", "owner": "orchestrator"},
    {"item": "Ticket AC says T, F, A, D all greyed; user chose F live when the fixture has transcript lines. Orchestrator to amend the AC wording.", "owner": "orchestrator"}
  ]
}
```

State: spec complete, user signed off. Ready for qa specify.

## Spec

### Flow
1. Not in demo: the button `Watch the demo` sits under the logo pill. Pressing it, or loading `?demo=den`, starts Demo mode. The existing `?demo=handoff` is untouched.
2. Starting from the button: `history.replaceState` adds `?demo=den`, no reload. The den swaps to the fixture replay. Walk mode exits, composer, review and transcript panels close, `nearby` clears. Focus stays on the button, whose label becomes `Leave demo`. Polite announcement: `Demo mode on. Playing recorded events.`
3. Leave: `Leave demo` drops the param (`replaceState`), returns to the live snapshot, exits walk mode, closes panels, focus stays on the button (label back to `Watch the demo`). Announce `Demo mode off. Showing the live den.`
4. Replay loops forever. Restart is a hard cut in reduced motion; otherwise the strip's loop glyph turns once over `dur-slow`. No announcement at restart.
5. In demo: no request to any steering route, no token, no session fetch use. The badge says Demo whatever the bridge connection is.
6. Card (walk mode) works as live: resident and split-off pandas, state, tool bubble, pending approval (lantern line), message status line from the recorded acknowledgement event.
7. Greyed actions: T, A, D disabled with reason `Demo mode: actions are off` (existing `DEMO_REASON`). F stays enabled (read-only replay of recorded transcript lines) only when the fixture holds lines for that agent; otherwise F disabled with `Demo mode: no transcript recorded`.

### Layout (see mockup)
- Badge: in the logo pill where the Live badge is. `surface-300` fill, 1px `line-strong` border, `radius-full`, padding 2px 10px 2px 8px, play glyph 10px plus the word `Demo`, `ink`, 12px/16px bold. Never `qi`, `lantern` or `alarm`.
- Strip: top-centre, 16px from top, height 32px, `surface-glass`, 1px `line`, `radius-full`, `shadow-panel`, horizontal padding 14px, loop glyph 14px plus `Demo mode · recorded events, looping`, `small` weight 600. Hidden below 900px (the badge stays).
- Button: left 16px, top 72px (8px under the 48px pill), min-height 36px (44px under 600px), `surface-glass` fill, 2px `line-strong` border, `radius-m`, `ink`, 13px/18px bold.
- Greyed buttons: disabled, `opacity-dim`; the reason text stays `ink-muted` at full opacity.

### Tokens used (all exist)
surface-300, surface-glass, line, line-strong, ink, ink-muted, lantern, lantern-fill, qi (card status dot only), focus-ring, radius-m/full, space-1..3, shadow-panel, opacity-dim, dur-slow.

### States
| State | What shows |
| --- | --- |
| Live | `Live` badge, `Watch the demo` button, no strip |
| Demo playing | `Demo` badge, `Leave demo` button, strip, replayed scene |
| Demo, panda waiting | Card lantern line with the recorded request; A, D greyed |
| Demo, ack recorded | Card status line `Message received` from the ack event; T greyed |
| Demo, F with lines | F enabled, opens the replayed transcript, no request |
| Demo, F without lines | F greyed, `Demo mode: no transcript recorded` |
| Loop restart | Cut to the start; glyph turn unless reduced motion |
| Reduced motion | No glyph turn, no fade |
| Light and dark | Tokens only; text 4.5:1; glyphs and focus ring 3:1 |
| Phone (<600px) | Strip hidden, badge carries `Demo`, 44px button |

### Copy
`Watch the demo` / `Leave demo` / `Demo` / `Demo mode · recorded events, looping` / `Demo mode: actions are off` / `Demo mode: no transcript recorded` / `Demo mode on. Playing recorded events.` / `Demo mode off. Showing the live den.` Sentence case, no emoji.

### Accessibility
WCAG 2.1 AA. The control is a real `button` with a visible 2px `focus-ring` at 2px offset. The badge carries the word Demo, not colour. Announcements go through one polite live region. Disabled actions keep `aria-describedby` to their reason.

## For qa specify (criteria mapping)
1. Fixture: at least two roles, one split-off panda, tool calls, one pending approval, one message ack; re-record note exists.
2. Replay driver (injected clock): events advance state, bubbles, approval; loops back to start.
3. Card in demo: T, A, D disabled with `Demo mode: actions are off`; F per the transcript-lines rule.
4. Stub bridge client/fetch that throws on any call: nothing called, no token read in demo.
5. Entry/leave by button and by `?demo=den`; URL updated; walk exits; panels close.
6. `npm test` green.
No browser-measurement tests: layout comes from the mockup.

## Hand-off notes
Existing code: `handoff-state.js` (`demoRequested`, `useDemoSnapshot`) only plays `?demo=handoff`; `App.jsx` passes `demo` to `ProximityCard`, composer and review (already grey T, A, D). Add the driver, the control, and the strip/badge in `LogoPill`.
