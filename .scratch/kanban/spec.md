# Kanban and Metrics (Den panel)

**Status:** ready-for-agent. Product spec, 2026-10-08, from the user's answers. Next cells: architect (ADR 0020, drag write path), designer (interactive UI spec with the user, terminal), then to-tickets.

## Problem Statement

The user cannot see the organism's work or its cost at a glance. The board is only visible through `npm run queue` and the terminal band. The existing Den Dashboard panel charts tickets per 5-hour window, tokens by cell and incidents by tool, but it has no kanban. Efficiency, quality and spend cannot be judged from it, and Jev's accuracy and thresholds are visible only through `scripts/jev-report.mjs`. The user wants one place that serves two readers' needs equally: what is in flight or stuck right now, and what to tune in the pipeline.

## Solution

The existing Den panel is extended with tabs. Vocabulary (see `CONTEXT.md`): **Kanban** is the Board tab; **Metrics** are the Efficiency, Quality, Economics and Jev tabs. The terminal mod version is a later ticket that reuses the same data module.

- **Kanban tab.** Columns: proposed, ready, in flight, waiting on you, blocked, resolved (recent). Each card shows ticket, priority and holder. Clicking a card shows the ticket. The user can drag a card across their own gates only; claimed cards are pinned and in flight and resolved are never drop targets.
- **Efficiency tab.** Bounces per resolved ticket, cells per ticket (including how often security was skipped by a clean risk-check), throughput, and consumption: 5-hour window % per ticket (trend) and burn rate against the limit (window % used, tickets resolved so far, projected tickets left before 90%). Default range 7 days at 5-hour-window grain; toggles 24h, 30d, all.
- **Economics tab.** Billed tokens per ticket and per role, orchestrator included. Depends on ticket 211 (spend rows); shows "no data yet" until then.
- **Quality tab.** Derived first from existing data: bounces per resolved ticket and advisory outcomes. Then a prerequisite ticket adds outcome rows (verify result, security result by severity, acceptance criteria met on first verify, the user's verdicts), and the tab adds them.
- **Jev tab.** From existing rows: agreement rate (order and advisory), bounce rate when Jev disagreed, fallback rate, latency, daily cost against the $0.50 cap. Per request type (`tier`, `route`, `verify`): a confidence histogram with the floor line (currently 0.8) and a what-if slider showing how agreement and bounces would change at another floor. Floors come from one small config file the tab reads. `wake`, `priority`, `scope` are listed as "no data". Jevgrep spend shows "not logged".

## User Stories

1. As the user, I want to see every ticket as a card in columns, so that I know what is ready, in flight, waiting on me and blocked without running a command.
2. As the user, I want claimed cards visibly pinned with their holder, so that I know a cell is working on them and I do not disturb it.
3. As the user, I want to drag a proposed ticket to ready, so that approving it takes one gesture.
4. As the user, I want to drag a ready ticket to parked, so that I can take it off the relay with a reason prompt.
5. As the user, I want a drop that the board refuses (claimed, resolved) to snap back with the reason shown, so that I understand why.
6. As the user, I want every drop recorded in the event log like a CLI command, so that the audit trail stays whole.
7. As the user, I want to click a card to read its ticket, so that I can decide without opening files.
8. As the user, I want the tickets waiting on me highlighted, so that I act on what blocks the relay.
9. As the user, I want to see bounces per resolved ticket, so that I can tell which tickets cost rework.
10. As the user, I want cells per ticket and the share of tickets that skipped security, so that I can judge whether the relay is lean.
11. As the user, I want tickets resolved per day and per 5-hour window, so that I can see throughput.
12. As the user, I want the 5-hour window % each resolved ticket cost, trended, so that I know how many tickets fit in a window.
13. As the user, I want a burn rate against the limit with a projection of tickets left before 90%, so that I plan the session.
14. As the user, I want the same ratios against the weekly cap, so that I see long-term pressure. (Later slice; weekly readings permitting.)
15. As the user, I want billed tokens per ticket by role including the orchestrator, so that I know where spend goes.
16. As the user, I want the Economics tab to say "no data yet" until spend rows exist, so that I am not shown guessed numbers.
17. As the user, I want bounces and advisory outcomes on the Quality tab now, so that I get value before outcome rows exist.
18. As the user, I want verify and security results, first-pass acceptance and my own verdicts logged and charted, so that I can judge quality over time.
19. As the user, I want Jev's agreement rate and bounce-when-disagreed, so that I can decide whether to trust its picks.
20. As the user, I want a confidence histogram per request type with the floor drawn on it, so that I can see how many picks cleared it.
21. As the user, I want a what-if slider for the floor, so that I can see what a different floor would have done before changing it.
22. As the user, I want the floors read from one config file, so that the tab and the orchestrator agree.
23. As the user, I want the daily Jev cost shown against the $0.50 cap, so that I see when the cap fires.
24. As the user, I want unused Jev use cases shown as "no data" and Jevgrep spend as "not logged", so that gaps are honest.
25. As the user, I want to switch range between 24h, 7 days, 30 days and all, so that I can zoom out.
26. As the user, I want the kanban and charts to refresh as the board changes, so that I do not reload.
27. As a later terminal user, I want the same numbers in a mod, so that I need not open the Den.

## Implementation Decisions

- **One data module** builds the kanban columns and every metrics series from the board files, `events.jsonl` and `usage.jsonl`. The existing metrics computation is extended, the existing `/metrics` endpoint stays, and a board-state read serves the kanban. The queue script's reader and the kanban share one column definition, so the terminal mod and the Den never disagree.
- **View-model** stays a pure layer between the data module and React, as the existing panel does. Components do no arithmetic.
- **Drag write path:** the bridge calls the board service in-process (ADR 0020, proposed; architect gate before any drag code). Allowed moves: proposed or parked to ready, ready to parked, and the user's own cards to or from waiting on you. A card with a live claim lock refuses the move.
- **Jev floors:** a small config file holds the floor per request type (tier 0.8, route 0.8, verify 0.8 for light). Today the floors exist only in `docs/jev-usecases.md` and ADR 0010 and the log does not record the threshold per row, so the what-if uses logged confidence and recomputes against the chosen floor. The config file's values must match the docs; a test checks that.
- **Jev tab data** is read from the existing `jev`, `jev-order` and `jev-advisory-outcome` rows; `jg` rows give latency and fallback only.
- **Consumption** needs window-percent readings from existing `usage` rows. Where a window has no reading, the ratio is omitted, not estimated.
- **Quality outcome rows** are a separate prerequisite ticket, touching the orchestrator's logging and `log-cell`, so it may need a `.claude/` change delivered as a command for the user.
- **Naming:** user-visible tab names are Kanban, Efficiency, Quality, Economics, Jev.
- The designer cell specs layout, drag affordances and mockups interactively with the user; the user does all visual critique.

**Phasing:** (1) Kanban tab, read-only. (2) Efficiency. (3) Economics, after 211. (4) Quality outcome rows, then the Quality tab additions. (5) Jev tab. (6) Drag, after ADR 0020 is accepted. (7) Terminal mod reusing the data module. Slices 1, 2 and 5 can start in parallel on different files.

## Testing Decisions

- Test external behavior only, with fixture `usage.jsonl`, `events.jsonl` and ticket files; no test reads the real board.
- **Seam 1, data module:** given fixtures, columns hold the right cards; bounces per ticket, cells per ticket, throughput, window % per ticket and burn-rate projection are correct; empty inputs give "no data", not zeros; the Jev series match hand-computed agreement, bounce and histogram counts; moving the floor changes the what-if as expected; config floors equal the documented ones.
- **Seam 2, view-model:** pure functions from the data module's output to chart and card shapes, including range toggles and empty states.
- **Drag** is tested at the bridge write endpoint against the board service: allowed moves write the same events as the CLI; claimed, resolved and in-flight moves are refused and change nothing.
- Prior art: `node --test` for `scripts/metrics.mjs`, `scripts/queue.mjs` (31 tests) and the dashboard model. No browser test seam; visual critique is the user's.

## Out of Scope

- Steering agents or sending messages from cards (v1 interaction card, ADR 0016).
- Dragging into in-flight or resolved, or editing ticket content.
- Reading Jevgrep spend from a provider billing API.
- Per-row threshold logging for Jev (the what-if works from confidence).
- Weekly-cap views beyond a later slice, and role-card (crew) views.
- Backfilling quality outcomes from old handoffs.

## Further Notes

- The existing `Dashboard.jsx` panel is extended, not replaced; its three charts become part of Efficiency or Economics.
- `CONTEXT.md` now defines **Kanban** and **Metrics** and no longer lists "kanban" or "metrics" under avoid in the old way.
- Open dependency: ticket 211 (billed spend) gates Economics.
- Housekeeping from handoff 93 that this spec does not cover: tickets 213 and 214, and about 20 old `worktree-agent-*` branches to ask about pruning.
