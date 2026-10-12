```json
{
  "ticket": "organism-infra/228-ui-run-any-frontier-ticket",
  "cell": "designer",
  "mode": "spec",
  "current_step": "UI spec written and signed off by the user (layout, stale-lock handling, ready-list length). Mockups published. Ready for qa specify.",
  "artifacts": ["https://claude.ai/artifact/BqPJ8iBVisEc9TLTiP9vN5 (mockups A room, B no room plus stale lock, C refusal, D mobile)"],
  "decisions": [
    "Run, role select and the slot strip live in StationsCard; the Needs you dispatch card gets the same role select and Run, and its prompt is hidden at room 0.",
    "Role choice is a native select beside Run, not a split button.",
    "A stale lock is shown and named, with no Clear button: the bridge has no release route, so a Clear action is a separate follow-up ticket (needs a route and a security look).",
    "The ready list shows every frontier ticket and scrolls inside the card; the slot strip stays pinned above it.",
    "Refusal text uses the existing gate-error style (alarm text); lantern and alarm stay out of the slot strip."
  ],
  "failures": [],
  "pending": [
    {"item": "qa specify: failing tests from the Acceptance for qa section below (pure models plus client dispatch), after 226 and 227 land", "owner": "qa"},
    {"item": "Follow-up ticket for a Clear-stale-lock action (bridge route, security review)", "owner": "orchestrator"},
    {"item": "User visual verdict after the developer builds, in both themes, at 375px and with reduced motion", "owner": "orchestrator"}
  ]
}
```

# 228 UI spec: Run any frontier ticket (signed off by the user, 2026-10-12)

Vocabulary and tokens: design system https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j. Only token names that exist there are used. Mockups: https://claude.ai/artifact/BqPJ8iBVisEc9TLTiP9vN5.

## Where
- `StationsCard` (apps/ui/src/overlay/Cards.jsx). The section "Next on the susan" lists ALL `queueModel(snapshot).frontier` rows, not `slice(0, 3)`. Header summary "N open · M ready" unchanged.
- New slot strip pinned above the list, always rendered.
- Needs you dispatch card (`gatesModel`, gate "dispatch"): adds the role select and Run for that ref; the dispatch prompt (note, Approve dispatch, Deny) is not rendered while `room == 0`.
- Out of scope: the Tally dialog, scene chips, any kanban (none exists in the den).

## Layout (top to bottom in the card: `surface-200`, `radius-l`, `space-4` padding, `space-3` between children)
1. Header: "Stations" (`heading`), summary (`small`, `ink-muted`). Then the station pills, unchanged.
2. Slot strip: `surface-100`, 1px `line`, `radius-m`, padding `space-2` `space-3`. Head: overline "Slots" (`overline`, `ink-muted`) left, "<load> of <max> running" (`small`, `ink`) right. One row per ref in `capacity.refs`: 20px pip, full ref in `code-small`, tag.
   - Live agent: pip filled `qi-fill` with `on-qi` glyph; tag "<role> · running" in `qi` text, 1px `qi` border, `radius-full`.
   - Lock with no live agent: pip with a 2px dashed `line-strong` ring and ◌ in `ink-muted`; tag "lock, no agent" in `ink-muted` with a dashed `line-strong` border. With any such row, one line under the strip (`small`, `ink-muted`): "A lock with no agent costs a slot until it is reclaimed on the board."
   - A ref that is both a live agent and holds the lock is ONE row (running). Order: running first, then locks, each by ref.
   - Never `lantern` or `alarm` here (reserved). Running and lock differ by glyph, word and border style, not hue alone.
3. Overline "Next on the susan". Ready rows, 1px `line` top border, `space-3` padding above, `space-2` between parts:
   - Priority chip (existing `pchip`) and title (`body-strong`).
   - Ref (`code-small`, `ink-muted`).
   - `<label>` "Role" (`small`, `ink-muted`), native `<select>`, Run button.
   - "Also running: <refs>" (`small`, `ink-muted`) when other refs hold slots: every ref in the strip except this row's own. Overlap is the user's call: no warning colour, no blocking.
   - The list scrolls inside the card at a fixed card height; the strip does not scroll away.
4. Select: `surface-200`, 2px `line-strong`, `radius-m`, 36px high (44px under 600px), 13px `body-strong`. Run: existing `.btn .btn-solid` (`qi-fill`, `on-qi`).

## Roles
- Options in this order: orchestrator, architect, product, designer, scout, herald. Never developer, qa or security.
- Default by ticket type: feature or bug: orchestrator; design-question: architect; spec work: product; UI or asset work: designer; anything unrecognised: orchestrator. Pure `defaultRole(ticket)` and `ROLE_OPTIONS` live in a `*-model.mjs`.
- The chosen role is per-ticket component state; not persisted.

## Capacity and Run
- Capacity is `snapshot.capacity` (226/227: `max, cap, load, live, room, refs`, where `refs` tells live agents from locks). Between snapshots the UI recomputes with the shared pure `capacity()` from 226 from the agents and ticket holders it holds, taking `max` and `cap` from the last snapshot. Run re-enables when an agent ends, with no reload.
- Run is enabled only when `room > 0`, the ticket has no live agent, and no start for that ref is in flight.
- Disabled: Run and the select are `disabled` (`opacity-dim`); every row shows a visible reason in place of "Also running": "<load> of <max> running: <refs>" (`small`, `ink-muted`), linked to Run by `aria-describedby`. When the 8-session cap binds, the same text uses `live` and `cap`.
- Click Run: `createBridgeClient().dispatch(ref, { role })` sends POST /agents `{ ref, role }`. In flight: "Starting…", `aria-busy="true"`, disabled. On 201 nothing is added optimistically; the agent arrives through the existing agent frames and the row leaves the list with the next snapshot. A 201 with `usageUnknown: true` adds one `small` line "Started. Usage reading unavailable."
- Failure: shown once under the controls in the existing `gate-error` style (`alarm` text), `role="alert"`: "Couldn't run: <status> <bridge error text>", with the bridge's text as sent (409 "not in the frontier" or "already has a live agent", 429 capacity or usage text) rendered as a React text node. Nothing retries; pressing Run again is the retry. The error clears on the next press or when the row's state changes.
- No steering session (401/403): Run disabled for the session with the gate cards' wording "Couldn't send: not signed in to steer". Demo mode: Run disabled, `title` "Demo mode: actions are off".

## Needs you dispatch card
- Room > 0: the existing prompt, with the role select and Run added above Approve dispatch. Run starts the agent directly; Approve dispatch still sends the orchestrator-facing request as today.
- Room == 0: no note, no Approve, no Deny. One line in their place: "No room to dispatch: <load> of <max> running." The eyebrow and title stay. Keys a, d and m do nothing while the prompt is absent.

## States
- Empty frontier: strip stays; list reads "The susan is empty." (existing copy).
- No snapshot or bridge offline: strip reads "Slots unavailable, bridge offline"; no rows, so no Run.
- Snapshot without `capacity` (older bridge): Run disabled with "Capacity unknown"; never enabled blind.
- Reduced motion: no animation is added. State swaps are instant; button transitions use `dur-fast` and are off under `prefers-reduced-motion: reduce`.
- Light and dark: every colour is a token (`surface-100`, `surface-200`, `ink`, `ink-muted`, `line`, `line-strong`, `qi`, `qi-fill`, `on-qi`, `alarm` for the error line only, `opacity-dim`), never a hex. Running and lock stay distinguishable without colour in both themes.
- 375px: rows wrap; select and Run share a line if they fit, else Run drops below at full width; 44px targets; refs use `overflow-wrap: anywhere`; no horizontal scroll.

## Copy
Slots · "<n> of <max> running" · "<role> · running" · "lock, no agent" · "A lock with no agent costs a slot until it is reclaimed on the board." · Role · Run · Starting… · "Also running: <refs>" · "<load> of <max> running: <refs>" · "No room to dispatch: <load> of <max> running." · "Couldn't run: <status> <bridge text>" · "Started. Usage reading unavailable." · "Slots unavailable, bridge offline" · "Capacity unknown".

## Accessibility (WCAG 2.1 AA)
- The strip is a labelled region (`aria-label="Slots"`). Rows read "<ref>, running as <role>" or "<ref>, lock held, no running agent"; pips are `aria-hidden`.
- Every select has a visible `<label>`. Run's accessible name is "Run <ref>" (`aria-label`; visible text stays "Run"). The disabled reason is visible text, not a tooltip.
- Only the refusal error is announced (`role="alert"`). The disabled reason changes with every snapshot and is not a live region.
- Text 4.5:1 on `surface-100` to `surface-200` in both themes; select border, focus ring and the dashed lock ring 3:1. Focus is a 2px `focus-ring` at 2px offset. Tab order: select then Run per row, top to bottom.

## Acceptance for qa
Pure models need no DOM: `defaultRole`; `ROLE_OPTIONS` has no developer, qa or security; `slotRows(capacity, agents)` (live vs lock, one row per ref, order); `runState({ capacity, ticket, inflight, steer })` (enabled or disabled plus the exact reason text); the client `dispatch` (201, 409 and 429 texts surfaced, no retry); the dispatch prompt absent at room 0 and present again at room > 0. The user's visual verdict covers the rest.

## Next step
qa `specify` once 226 and 227 are merged (228 is blocked by 227). Skills: tdd. Gotcha: `board comment` has an argument length limit, so the full spec lives here and the ticket carries a pointer.
