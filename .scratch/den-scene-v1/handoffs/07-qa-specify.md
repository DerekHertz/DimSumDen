# den-scene-v1/07 qa specify: floating cards, bottom overlays, free zoom

Branch `tests/floating-cards07` (from main 1c2f73e), commit dd0577a. One new file:
`apps/ui/src/overlay/floating-cards.test.mjs`. 25 browser tests (Vite dev server + headless Chromium, same harness as
`scene/tally-expand.test.mjs`), all red for the right reason (the overlays, `data-overlay` roots and zoom nav do not exist).
No setup errors; the app mounts and the Tally pill is found. Run: `node --test apps/ui/src/overlay/floating-cards.test.mjs`.

The file header is the **markup contract** the developer must meet (data-overlay roots, region names, header = first
`button[aria-expanded]`, `data-station-pill` ids, `<nav aria-label="Zoom level">` with `data-zoom`). Read it first.

## State

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "qa",
  "mode": "specify",
  "current_step": "25 failing tests committed on tests/floating-cards07 (dd0577a); criterion map below; ready for a developer",
  "artifacts": [
    "branch tests/floating-cards07",
    "apps/ui/src/overlay/floating-cards.test.mjs"
  ],
  "decisions": [
    "Browser tests at the mounted-App seam, not renderToString: no .jsx can be imported under node --test (no JSX transform) and the repo has no renderToString test; the Vite + Playwright pattern already exists",
    "Zoom is tested through data-zoom on the zoom nav, with the digest's literals [0.55, 1.2] (default 1, smaller is closer). No camera module is imported, so ticket 02 can land first or second",
    "No axe dependency exists; added a hand-rolled stand-in (accessibility tree names, unique ids, named landmarks, aria-controls, den words). Adding axe-core is a dependency gate for security/orchestrator",
    "Phone and 'Offline' behaviour: phone stacking, collapse and hidden zoom/timeline are tested (digest marks them proposed); the Offline badge state is not tested"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement to the contract in the test header; migrate the old tests listed below in the same commit",
      "owner": "developer"
    },
    {
      "item": "Confirm the m, j, k key meanings (see Open questions) and the 'Offline' badge state",
      "owner": "designer"
    }
  ]
}
```

## Criterion to test map

All tests are in `apps/ui/src/overlay/floating-cards.test.mjs` (titles abbreviated).

| Criterion or scope item | Test |
|---|---|
| Order: logo pill, Needs you, Stations & queue (as changed) | "DOM order is logo pill, Needs you, Stations & queue" |
| No usage meter; sidebar gone; scene full width | "no sidebar: no aside or .panel ... no plan usage meter" |
| 320px floating cards, 16px gutters, 10px gap, 580 intent, 220 timeline | "desktop geometry at 1440 x 900" |
| Logo pill: Dim Sum Den, Live in qi | "logo pill shows ..." |
| Needs you contents: eyebrow, title, code well, rows with age, key hints visible | "Needs you: open with waiting requests ..." |
| a / d respond (POST /requests) | "'a' approves and 'd' denies the top request ..." |
| m, j, k | "typing 'a' or 'd' in the Note field ... 'm'" and "'j' and 'k' step through ..." |
| Keys are card-scoped, not in Tally dialog | "card keys are card-scoped" |
| Collapsible Needs you; empty state | "Needs you collapses and reopens ..." |
| Stations & queue collapsible, default closed | "Stations & queue is closed by default ..." |
| Waiting pill ("· waiting", lantern) | "open stations: one pill each in order ..." |
| Dormant dashed pills; Cubs "N asleep"; coming online | "dormant stations are dashed ..." |
| Queue: "5 open · N ready", Next on the susan, P-chip rows, empty susan | "summary and queue ..." |
| Pill click zooms to station | "clicking an open station pill zooms ..." |
| Zoom switcher labels exact; current in qi; + / - aria-labels | "zoom switcher labels are exactly ..." |
| Level buttons dolly | "clicking a level makes it current ..." |
| + and - step the same zoom; clamp test (scope) | "+ and - buttons step the same zoom ... clamp at [0.55, 1.2]" |
| Wheel zoom + clamp (scope) | "scroll wheel over the scene ..." |
| Pinch zoom (scope) | "two-finger pinch zooms ..." (CDP touch; two pointer ids confirmed to reach the page) |
| Intent placeholder, Ctrl K, Send, autonomy, Current intent | "intent bar: ..." |
| Timeline copy | "timeline: Live, a time, and the replay caption" |
| Phone: stack, collapsed, one open at a time, hidden zoom/timeline, 100vw-32 intent | "phone (390 px) ..." |
| Keyboard reach, digest tab order, 2px focus ring at 2px offset | "every control is keyboard-reachable ..." |
| axe (stand-in), den words, one h1 | "accessibility basics ..." |

## human-verified (no automated test)

- Designer review pass at desktop and mobile widths, light and dark (criterion 8).
- Visual feel: portrait ring, lantern top edge, glyphs, shadows, motion (fade and 8px slide, reduced-motion cut).
- That the clamp keeps the camera outside every kiosk and above the floor at every zoom: the test pins the numeric range only; the designer confirms the range on the ortho camera (ticket 02).
- Touch targets of 44px at `pointer: coarse` (digest section 7).
- Dark theme token values.

## Open questions

1. `m`, `j`, `k`: the ticket cites "ApprovalCard specifies" but that spec is a design-system artifact. QA read `m` as "focus the Note field" and `j`/`k` as next/previous waiting request. If the artifact says otherwise, change the tests, not the code.
2. A waiting request is a ticket with `gate` merge or dispatch (existing `gates-model.mjs`); the digest's "dev-02 wants to run Bash" tool-approval rows have no data source yet. The row age reads `holder.since`.
3. "5 open" in the summary is read as the five open stations (Pass, Steamers, Tea, Pantry, Front of House).
4. Ticket says `a`/`d` work "when the card has focus"; digest says "while Needs you is open and focus is not in a text field". Tests cover only the intersection (focus in the card, not in the Note field) and the negative cases (scene focus, Tally dialog).

## Existing tests that will break or need migrating

- `apps/ui/src/scene/tally-card-wiring.test.mjs`: "the sidebar usage slot is still wired (07 removes it, not 05)" asserts `Plan usage (5 h)` and `<UsageMeter` in App.jsx. Invert or delete it.
- `apps/ui/src/scene/tally-expand.test.mjs`: `scrollState` reads `document.querySelector(".panel").scrollTop`; with `.panel` gone it throws. Drop the panel half. Its header comment about "the sidebar's own usage meter" is stale too.
- `apps/ui/src/scene/camera-rig.test.mjs`, `default-framing.test.mjs`, `tally-pill.test.mjs`: only if the wheel/zoom handler or camera constants move (ticket 02 owns those).
- `apps/ui/src/panel/*.test.mjs` (gates, queue, usage-meter models) pass today; keep them if the new cards reuse the models, delete with the models if not. Orphaned `usage-meter-model` stays used by the Tally.
- `apps/ci-cd/smoke-ui.mjs` may look for the sidebar; the developer should grep it.

## Notes for the developer

- Nothing here imports camera code; wire `data-zoom` to whatever value the rig reads (one source for wheel, pinch, + and - keys, buttons and level clicks).
- The tests use `reducedMotion: "reduce"`, so animations do not delay assertions.
- Level 4 "Workspace" has no behaviour test (no destination defined yet); only its label.
