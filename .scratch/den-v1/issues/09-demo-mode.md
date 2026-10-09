# 09: Demo mode: walk the den and its cards on recorded fixture events

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately; den-v1/01-04 resolved)

**Status:** ready-for-human

**Serves:** Den v1 user story 25 (Demo mode), the showcase: a den you can show others with no live agents and no steering runtime.

## What to build

A recorded fixture event stream checked into the repo, and a Demo mode that replays it into the den. Walk mode and the proximity card then work as they do live: resident and split-off pandas, state changes, tool-call bubbles, a panda waiting on the user, and a message acknowledgement. Every steering action on the card (T, F, A, D) is shown greyed out with the reason "Demo mode". Demo mode is entered from a control and a URL parameter (for example `?demo=den`), the replay loops, and Demo mode makes no request to any steering route.

The look of the entry control, the Demo mode indicator and the greyed actions comes from a designer `spec` session with the user (very detailed spec plus low-cost mockups the user signs off on) before qa specify.

Today, `?demo=handoff` (`apps/ui/src/handoff-state.js`, `apps/ui/src/scene/handoff-fixture.mjs`) plays a scripted handoff only. `apps/bridge/bridge-fixture.mjs` is a state snapshot for tests. No recorded agent event stream exists yet.

## Acceptance criteria

- [ ] A fixture event stream (at least two roles, one split-off panda, tool calls, one pending approval and one message acknowledgement) lives in the repo, with a short note on how to re-record it.
- [ ] Demo mode replays the fixture into the den in a loop; pandas take over, change state and show bubbles as the events dictate (test on the replay driver).
- [ ] In Demo mode, walk mode and the card work; T, A and D are greyed out with the reason "Demo mode: actions are off", and F stays enabled (read-only replay) only when the fixture holds transcript lines for that agent, otherwise greyed with "Demo mode: no transcript recorded" (test).
- [ ] Demo mode makes no request to any steering route and needs no bridge token (test).
- [ ] Entering and leaving Demo mode works from the control and from the URL parameter.
- [ ] The user signs off the visual critique (`ready-for-human`) before risk-check.
- [ ] `npm test` is green.

## UI spec (designer, signed off by the user 2026-10-08)

Mockup: https://claude.ai/artifact/6hzqB87i5AH4qcLBt5MNHB. Source: `handoffs/09-designer-spec.md`.

### Flow
1. Not in demo: the button `Watch the demo` sits under the logo pill. Pressing it, or loading `?demo=den`, starts Demo mode. The existing `?demo=handoff` is untouched.
2. Starting from the button: `history.replaceState` adds `?demo=den`, no reload. The den swaps to the fixture replay. Walk mode exits, composer, review and transcript panels close, `nearby` clears. Focus stays on the button, whose label becomes `Leave demo`. Polite announcement: `Demo mode on. Playing recorded events.`
3. Leave: `Leave demo` drops the param (`replaceState`), returns to the live snapshot, exits walk mode, closes panels, focus stays on the button (label back to `Watch the demo`). Announce `Demo mode off. Showing the live den.`
4. Replay loops forever. Restart is a hard cut in reduced motion; otherwise the strip's loop glyph turns once over `dur-slow`. No announcement at restart.
5. In demo: no request to any steering route, no token, no session fetch use. The badge says Demo whatever the bridge connection is.
6. Card (walk mode) works as live: resident and split-off pandas, state, tool bubble, pending approval (lantern line), message status line from the recorded acknowledgement event.
7. Greyed actions: T, A, D disabled with reason `Demo mode: actions are off` (existing `DEMO_REASON`). F stays enabled (read-only replay of recorded transcript lines) only when the fixture holds lines for that agent; otherwise F disabled with `Demo mode: no transcript recorded`.

#### Layout (see mockup)
- Badge: in the logo pill where the Live badge is. `surface-300` fill, 1px `line-strong` border, `radius-full`, padding 2px 10px 2px 8px, play glyph 10px plus the word `Demo`, `ink`, 12px/16px bold. Never `qi`, `lantern` or `alarm`.
- Strip: top-centre, 16px from top, height 32px, `surface-glass`, 1px `line`, `radius-full`, `shadow-panel`, horizontal padding 14px, loop glyph 14px plus `Demo mode · recorded events, looping`, `small` weight 600. Hidden below 900px (the badge stays).
- Button: left 16px, top 72px (8px under the 48px pill), min-height 36px (44px under 600px), `surface-glass` fill, 2px `line-strong` border, `radius-m`, `ink`, 13px/18px bold.
- Greyed buttons: disabled, `opacity-dim`; the reason text stays `ink-muted` at full opacity.

#### Tokens used (all exist)
surface-300, surface-glass, line, line-strong, ink, ink-muted, lantern, lantern-fill, qi (card status dot only), focus-ring, radius-m/full, space-1..3, shadow-panel, opacity-dim, dur-slow.

#### States
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

#### Copy
`Watch the demo` / `Leave demo` / `Demo` / `Demo mode · recorded events, looping` / `Demo mode: actions are off` / `Demo mode: no transcript recorded` / `Demo mode on. Playing recorded events.` / `Demo mode off. Showing the live den.` Sentence case, no emoji.

#### Accessibility
WCAG 2.1 AA. The control is a real `button` with a visible 2px `focus-ring` at 2px offset. The badge carries the word Demo, not colour. Announcements go through one polite live region. Disabled actions keep `aria-describedby` to their reason.

## For qa specify (criteria mapping)
1. Fixture: at least two roles, one split-off panda, tool calls, one pending approval, one message ack; re-record note exists.
2. Replay driver (injected clock): events advance state, bubbles, approval; loops back to start.
3. Card in demo: T, A, D disabled with `Demo mode: actions are off`; F per the transcript-lines rule.
4. Stub bridge client/fetch that throws on any call: nothing called, no token read in demo.
5. Entry/leave by button and by `?demo=den`; URL updated; walk exits; panels close.
6. `npm test` green.
No browser-measurement tests: layout comes from the mockup.

## Comments
- **orchestrator, 2026-10-08:** Filed on the user's yes. Story 25 had no ticket; this is the shortest path to a showable den, independent of the runtime chain (202, 143, 106, 107). UI ticket: designer spec with the user first; never batched.
- **orchestrator, 2026-10-08:** Designer spec signed off; copied above. F/T/A/D criterion amended per the user's choice (F live when the fixture has transcript lines; reason text "Demo mode: actions are off"). Next: qa specify.
- **qa, 2026-10-09:** qa specify: tests at 852b0fd on feat/09-demo-mode. human-verified: AC6 user sign-off, badge/strip/button look, focus, reduced motion, responsive, contrast. See handoffs/09-qa-specify.md.
- **qa, 2026-10-09:** QA pass (light verify) at 1168db0. Suite 3170 pass, 0 fail, 0 skipped (developer's saved run). Specify test files unchanged since 852b0fd. Every AC maps to a test or is human-verified (AC6). Out-of-scope edits listed in handoff 09-qa-verify.md, including a one-path exemption in apps/ui/reachability.test.mjs.
- **orchestrator, 2026-10-09:** orchestrator, 2026-10-08: qa light verify passed (3170/3170). Held at ready-for-human for the user's visual critique before risk-check. Check also: .den-entry moved 88px to 120px; reachability.test.mjs exemption for demo/README.md.
