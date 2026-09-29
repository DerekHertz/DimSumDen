```json
{"cell": "designer", "mode": "spec", "ticket": "dimsumden-ui-v0/07-ui-shell", "status": "ready-for-agent", "covers": ["07", "08", "09", "10", "11"], "branch": null}
```

# UI spec: Dim Sum Den UI v0 (shell, scene, panel, gates, dashboard)

One spec for tickets 07 to 11. Desktop only (min 1280px wide). Token names are from the "Agent Office" design system `project/tokens.json`; developers expose them as CSS custom properties (`--surface-100`, and so on) in `apps/ui` for both themes. Data shapes are ADR 0011 decisions 3, 5 and 7.

## 1. Shell layout (07)

- Full-viewport CSS grid, `grid-template-columns: 1fr 440px`, height 100vh, no page scroll. Background `surface-100`.
- Left: `<main aria-label="Den scene">` holding the R3F canvas, fills its cell. Scene ground `surface-000`.
- Right: `<aside aria-label="Control panel">`, background `surface-200`, left edge 1px `line`, padding `space-4`. It scrolls on its own (`overflow-y: auto`), sections separated by `space-5`.
- Panel order, top to bottom: header, usage meter (09), gates list (10), queue (09), selected ticket plus handoff (09), dashboard (11). 07 renders the header and empty section slots with their headings only.
- Header: "Dim Sum Den" in `title`, plus the connection pill on the right.
- Fonts: `sans` (Nunito) for UI, `mono` for refs and code. Loading them from Google Fonts is a network fetch; if the developer prefers no external request, fall back to the family's system stack (open question 1).

### Connection pill (07)

`small` text in a `radius-full` pill with an icon, never colour alone:
- live: dot `qi`, "Live".
- connecting / reconnecting: `ink-muted`, "Reconnecting..." (`aria-live="polite"`).
- bridge unreachable over 10 s: `alarm` text, "Bridge offline: run npm run ui".
- Before the first snapshot the panel shows "Connecting to the den..." in `ink-muted`; the scene shows Bao alone.

### Themes

Light (bamboo grove) is the default; dark (lantern dusk) follows `prefers-color-scheme`. No toggle in v0. Scene lighting stays the same in both; only DOM surfaces change. (Background colour of the canvas follows `surface-000`.)

### Reduced motion

`prefers-reduced-motion: reduce`: no CSS transitions beyond opacity at `dur-fast`; the scene still poses cells but skips idle/breathing loops (the director's rest pose per state) and camera easing.

## 2. Scene (08)

- Fixed camera framing Bao seated, all four perch regions (crown, shoulders, knees, grass) in view; no orbit controls in v0 (open question 2).
- One plush per `SceneCell`, posed by the director from `pose`. Cell type reads from its prop (asset contract), not colour.
- Status badge: a DOM overlay chip over each plush (drei is not approved, so project world position to screen and position an absolute `div`). Chip = state icon + label in `small`: working "Working" `state-working`; waiting_on_user "Needs you" on `lantern-fill` with `on-lantern` text and `glow-lantern`; blocked "Blocked" `state-blocked` dashed border; done "Done" `state-done`; idle "Queued" `state-idle` at `opacity-dim`.
- Selected plush: chip gets a 2px `focus-ring` outline; the matching queue row is selected.
- Click on a plush or its chip selects the ref. The chips are `<button>`s (`aria-label="<title>, <state label>"`) so the scene is keyboard reachable; Tab order follows `SceneCell` order.
- Hover: pointer cursor, chip lifts to `surface-300` background, `dur-fast` `ease-soft`.
- Empty (`[]`): Bao alone plus a centred caption "The den is quiet. No active tickets." in `ink-muted` `body`.
- Over 12: already cut by `MAX_PLUSH`; show "+N more in queue" caption bottom-left in `small`.

## 3. Panel (09)

### Usage meter

- Label "Plan usage (5 h)" `overline`, value `heading` e.g. "74%", bar 8px `radius-full`, track `surface-300`.
- Fill: under 80 `qi-fill`; 80 to 94 `lantern-fill` plus "Wind down" `small` in `lantern`; 95+ `alarm-fill` plus "At limit" in `alarm`. Text carries the state, not only colour.
- `role="meter"` with `aria-valuenow/min/max` and `aria-valuetext="74 percent of 5-hour window"`.
- Secondary line `small` `ink-muted`: "weekly 72% · sampled 12 min ago".
- No sample: value "not sampled", no bar fill, `ink-muted`.

### Queue

- Heading "Queue" `title`. Rows in `frontier` order first, then other active tickets (claimed, in-review, blocked, ready-for-human) under a "In flight" `overline`.
- Row (`radius-m`, padding `space-3`, a real `<button>` inside a list item): priority pill (`effectivePriority`, `radius-full`, `small`, `line-strong` border), title `heading` (one line, ellipsis), ref `code-small` `ink-muted`, cellType + status in `small`.
- Bumped: pill shows "P1 ↑" with `title`/`aria-label` "Bumped from P2 after 3 sessions". Never colour only.
- Blocked: row text `state-blocked`, dashed `line-strong` border, "Blocked by 05-bridge-events (ready-for-agent)" in `small`; if `blockedReason`, show it clamped to 2 lines.
- Selected row `surface-300`, `aria-current="true"`. Hover `surface-300` at half step via `dur-fast`.
- Empty: "Nothing queued. The board is clear." `ink-muted`.

### Selected ticket and handoff

- Title `heading`, ref `code-small`, status + holder `small`.
- Handoff: rendered by `render-markdown.mjs` in `body`; code blocks `code` on `surface-300` `radius-m`, horizontally scrollable; path + mtime ("updated 5 min ago") in `small` `ink-muted`; `truncated` shows "Handoff truncated. Open <path> for the rest."
- No selection: "Select a ticket in the queue or the scene." No handoff: "No handoff yet."
- Region is `aria-live="off"` (don't read full markdown on every update).

## 4. Gates (10)

- Section "Needs you" `title` with a count badge (`lantern-fill`, `on-lantern`, `radius-full`). Hidden entirely when there are no gates (not an empty box).
- One card per ticket with `gate` non-null: `surface-200`, 1px `line-strong` border, `radius-l`, `glow-lantern` ring. Eyebrow `overline` "MERGE" or "DISPATCH"; title; ref.
- Optional note: `<textarea>` labelled "Note (optional)", 2 rows, max 500 chars with a live counter at 450+, `radius-s`, border `line-strong`.
- Buttons, `body-strong`, `radius-m`, min 36px high, gap `space-2`: "Approve merge" / "Approve dispatch" solid `qi-fill` with `on-qi`; "Reject" outline `line-strong`, `ink` text. Verb in the label so it stands alone for screen readers.
- Pressing: both buttons disabled immediately (no double submit), label "Sending...".
- Pending (`request` present): buttons replaced by a lantern-icon line "Approval sent, waiting for the orchestrator" (or "Rejection sent..."), `small` in `lantern`, note echoed in quotes. `aria-live="polite"`.
- Error (4xx/network): inline `alarm` text under buttons, e.g. "Couldn't send: already pending (409)". Buttons re-enabled except on 409-pending.
- No confirm dialog (the orchestrator is the real gate; nothing executes). Open question 3.

## 5. Dashboard (11)

- Heading "Pipeline" `title`. Three charts stacked, each full panel width (about 408px) by 140px, then no separate usage tile if the meter from 09 already shows it (open question 4); if 11 must add the tile, reuse the meter component.
- Follow the `dataviz` skill. Bars use a single series colour, `qi`, since each chart has one measure; categories are on the axis, not in colour. Axis labels and values `small` `ink-muted`, gridlines `line`, value label on or above every bar (`small` `ink`).
  - Throughput: vertical bars per 5 h window, x = window start "Sep 29 06:00", y = tickets resolved. Last 12 windows max.
  - Tokens per resolved ticket by cell type: horizontal bars, sorted descending, values abbreviated "182k".
  - Incidents per ticket by tool: horizontal bars, sorted descending.
- Each `<svg role="img">` with `<title>` and a `<desc>` summarising the values; a visually hidden `<table>` of the same data after it.
- Empty metric: the chart frame with centred "No data yet" in `ink-muted`, never a zero bar.
- Metrics fetch error: "Metrics unavailable" `alarm` `small` with a "Retry" text button.

## 6. Accessibility (all tickets)

- WCAG 2.1 AA. All listed token pairs are documented at 4.5:1+ except `ink-faint` (3:1, only for idle glyphs, never text) and `lantern` on `surface-*` in light (use it only for text 14px bold or larger, or fall back to `ink` beside a lantern icon).
- Every focusable element shows a 2px `focus-ring` at 2px offset; tab order: header, usage, gates, queue, detail, dashboard, then scene chips (or scene first; see open question 5).
- State always = icon + text label, never colour alone.
- Landmarks: `main` (scene), `aside` (panel), each section a `<section aria-labelledby>`.
- Canvas has `aria-hidden="true"`; the chip buttons carry the scene's accessible content.

## 7. Copy list

"Dim Sum Den", "Live", "Reconnecting...", "Bridge offline: run npm run ui", "Connecting to the den...", "The den is quiet. No active tickets.", "Plan usage (5 h)", "not sampled", "Wind down", "At limit", "Queue", "In flight", "Nothing queued. The board is clear.", "Select a ticket in the queue or the scene.", "No handoff yet.", "Needs you", "Approve merge", "Approve dispatch", "Reject", "Note (optional)", "Sending...", "Approval sent, waiting for the orchestrator", "Rejection sent, waiting for the orchestrator", "Pipeline", "No data yet", "Metrics unavailable", "Retry".

## Open visual questions (for the user, via the orchestrator)

1. Load Nunito / ZCOOL KuaiLe / JetBrains Mono from Google Fonts, or system stacks only for a local tool? Recommendation: system stacks in v0, no external fetch.
2. Fixed camera vs orbit controls in the scene. Recommendation: fixed in v0.
3. Should Approve merge ask for confirmation? Recommendation: no, since it only files a Gate request.
4. Ticket 11's "usage tile" duplicates 09's meter. Recommendation: one meter, in 09.
5. Keyboard order: panel first or scene chips first. Recommendation: panel first.
6. Panel width 440px fixed vs resizable. Recommendation: fixed.

## Notes

- Design system names still say "Agent Office"; renaming to Dim Sum Den is design-system upkeep for later, not this ticket.
- No dependency or `.claude/` change proposed.
- Next: qa `specify` on 07 using sections 1 and 6.
