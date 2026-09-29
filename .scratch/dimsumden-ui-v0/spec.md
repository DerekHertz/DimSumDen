# Spec: Dim Sum Den UI v0

Status: ready-for-agent
Author: product cell, 2026-09-28

## Problem Statement

I run the organism from terminals and read the board as markdown. I can't see at a glance what each cell is doing, what is waiting on me, how much plan usage is left, or whether the pipeline is getting better. Brain gates (merge, dispatch) mean scrolling back to the right terminal.

## Solution

A local web page with a live 3D scene on the left and a control panel on the right (desktop only). The scene shows one plush cell per active ticket, posed by status, using the existing Bao and plush assets and existing state poses. The panel shows the prioritised ticket queue, the latest handoff per ticket, a usage meter, three dashboard charts, and approve/reject buttons for brain gates. A thin Node bridge server watches `.scratch/`, streams changes over SSE, and runs board actions through the existing `board` CLI. Button presses only append a Gate request line to a file the orchestrator reads. The UI never launches agents.

This is the first UI iteration: a base to build on, for watching the pipeline evolve. It is a stand-in for organism-infra/03's daemon, which can replace the bridge later behind the same HTTP/SSE surface.

## User Stories

Bridge
1. As the user, I run one command and get the page served with live updates, so I don't wire anything by hand.
2. As the user, I see a ticket move to `claimed` in the page within about 2 seconds of a cell claiming it, so the view is live.
3. As the user, I get the full current state on page load or reconnect, so refreshing never leaves me stale.
4. As the user, the bridge reads the Board (issues, locks, handoffs, `events.jsonl`, `usage.jsonl`) and never writes it except through the `board` CLI, so the Board service stays the single writer.
5. As the user, the bridge binds to localhost only, so nothing on the network can press my gates.

Scene
6. As the user, I see one plush cell per active ticket (claimed, in-review, blocked, and the waiting frontier), so I see who is doing what.
7. As the user, a cell's pose and perch follow its ticket status, using existing state poses only, so status reads without text.
8. As the user, a ticket leaves the scene when it resolves, so the scene stays under about 12 plush.
9. As the user, the cell's cell type is recognisable (colour or prop from the existing asset contract), so I can tell developer from qa.
10. As the user, clicking a plush selects its ticket in the panel, so I can jump from the scene to details.
11. As the user, the scene stays usable if there are zero active tickets (Bao alone), so an empty board is not a blank screen.

Queue and handoffs
12. As the user, each ticket carries a `**Priority:** P0` to `P3` line; a missing line means P2, so old tickets still sort.
13. As the user, the frontier is sorted by priority, then age, so the most important ready work is on top.
14. As the user, a frontier ticket that has waited through 3 sessions is bumped one level (P3 to P2, and so on, never above P0), so nothing starves. A session is one new `.scratch/_handoffs/*-orchestrator-*.md` file.
15. As the user, I see each ticket's effective priority and whether it was bumped, so the order is explainable.
16. As the user, I see the latest handoff for a ticket (rendered markdown, from `handoffs/`), so I can read what the last cell said without opening files.
17. As the user, blocked tickets show what blocks them, so I know what to unblock.

Gates
18. As the user, when a ticket needs merge approval I see Approve and Reject buttons, so I decide without switching terminals.
19. As the user, when the orchestrator proposes a dispatch I see Approve and Reject buttons, so I control what starts.
20. As the user, a press appends one line `{id, ts, kind, ref, note?}` to `.scratch/_requests/requests.jsonl`, where `kind` is `merge-approve`, `merge-reject`, `dispatch-approve` or `dispatch-reject`, so the orchestrator has a durable record.
21. As the user, I can add an optional note to a press, so I can say why I rejected.
22. As the user, a pressed button shows "pending" until the orchestrator marks the request handled, and can't be pressed twice, so I don't double-approve.
23. As the user, the orchestrator reads unhandled requests at session start and marks each handled; nothing in the UI or bridge executes a merge or dispatch, so a misclick cannot ship code.

Usage and dashboard
24. As the user, I see plan usage % in a meter tile, with "not sampled" when there is no sample, so I know when to stop dispatching.
25. As the user, I see throughput: tickets resolved per 5-hour window, as bars, so I see the pace.
26. As the user, I see tokens per resolved ticket by cell type, as bars, so I see which cells cost most.
27. As the user, I see friction: incidents per ticket by tool, as bars, so I see which tools hurt.
28. As an agent, I run `scripts/metrics.mjs --json` and get the same JSON the panel renders, so agents and the UI never disagree.
29. As the user, a metric with no data shows an empty state, not zero-as-truth, so I don't misread it.

## Implementation Decisions

- **Three pieces**: the bridge server, the metrics script, and the UI app (scene plus panel).
- **Bridge** serves the built UI, `GET /state` (a full snapshot), and `GET /events` (SSE, snapshot first, then incremental change events). It watches the Board with a filesystem watcher plus tailing of `events.jsonl` and `usage.jsonl`. Board actions go through the `board` CLI. `POST /requests` appends to the request file and is the only write it does directly.
- **State snapshot shape** (one JSON document): tickets (ref, title, status, effective priority, bumped flag, blocked-by, holder cell type, latest handoff path and text), usage percent and sample time, and pending requests. The scene and panel both derive from it.
- **Scene-from-state** is a pure function: snapshot in, list of `{ref, cellType, status, perch, pose}` out. The renderer only draws that list. Perch and pose reuse the existing character-animation spec and asset contract. Nothing new is animated.
- **Priority** is parsed from the ticket's `**Priority:**` line. Missing means P2. The frontier sorts by effective priority, then ticket age (oldest first). The bump counts how many orchestrator handoff files were created since the ticket first became ready; 3 or more bumps one level.
- **Gate request** is a new domain term (a line in the request file recording a user's approve/reject on a Brain gate). It needs a CONTEXT.md entry; see Further Notes.
- **Metrics** (`scripts/metrics.mjs --json`) prints: throughput per 5-hour window, tokens per resolved ticket by cell type, incidents per ticket by tool, latest usage %. It derives from `usage.jsonl` and `events.jsonl` only, with no dependency on transcripts yet. Bounce rate and Jev shadow savings are deferred.
- **Charts** are inline SVG with no chart dependency, matching the pipeline-telemetry decision. Follow the `dataviz` skill.
- **Layout**: desktop only, scene left, panel right. No responsive work.
- **UI stack**: React and React Three Fiber per the project stack. Any new dependency is a Brain gate for the developer cell, to be proposed in the ticket handoff.
- **Supersedes**: this spec supersedes the "Agent Office UI panel (a later spec)" line under Out of scope in `.scratch/pipeline-telemetry/spec.md`. The first slice of the telemetry dashboard now lives in this panel. The telemetry spec's transcript-derived metrics (error clusters, savings proposals, per-tool token cost) remain future work and plug into the same `metrics --json` output.

## Testing Decisions

- Good tests check external behaviour through the three accepted seams, not internals.
- **Seam 1, bridge HTTP/SSE surface**: start the bridge against a fixture `.scratch/` tree in a temp dir. Assert `/state`, SSE events after a fixture file change, and `POST /requests` appending a valid line. Prior art: `apps/ci-cd/dev-server.test.mjs` and the board fixture in `apps/organism-infra/board-fixture.mjs`.
- **Seam 2, metrics JSON**: run the script on fixture `usage.jsonl` and `events.jsonl` and compare to an expected JSON. Prior art: `scripts/usage-rows.test.mjs` and `scripts/jev-report.test.mjs`.
- **Seam 3, scene-from-state**: a pure-function table test over snapshots. Prior art: `apps/ui/src/assets/prop-placement.test.mjs`.
- **Smoke test per piece**, each a single command that exits non-zero on failure:
  - Bridge: start it on a fixture tree, fetch `/state`, open SSE, touch a ticket file, see the change event, POST a request, check the file line.
  - Metrics: `node scripts/metrics.mjs --json` on the fixture returns the four keys with expected values.
  - Scene and panel: load the page against the fixture bridge with the existing browser smoke (`apps/ci-cd/smoke.mjs`); assert no console errors, one plush per active fixture ticket, the queue in priority order, and that pressing Approve creates one request line.
- Priority sort and the 3-session bump each get table tests, including a missing priority line, a P0 that can't be bumped, and a bump counted from orchestrator handoff files only.

## Out of Scope

- Launching, stopping, or killing agents from the UI.
- Executing merges, pushes, or dispatches from a button.
- Phone or responsive layout.
- Fur, fancy animation, new poses, new assets.
- Handling gates other than merge and dispatch approval (dependency, `.claude/` change).
- Bounce rate, Jev shadow savings, error clusters, savings proposals, transcript ingestion.
- Showing resolved tickets in the scene.
- Auth (localhost only).
- Replacing the bridge with the organism-infra/03 daemon.

## Further Notes

- Target: about 10 to 12 tickets built by the relay in one day, so slice thin: bridge snapshot, SSE, priority and bump, metrics, scene-from-state, renderer, panel shell, queue and handoff, gates, charts, and a smoke pass.
- The user watches the pipeline evolve through this UI, so keep the snapshot shape stable and additive; later panels should only add keys.
- Pending: the CONTEXT.md entry for **Gate request** is a gated edit. Proposed text: "Gate request: the recorded approve or reject the user gives a Brain gate from the UI. The orchestrator reads it and marks it handled. _Avoid_: Approval click, command." It goes under Control.
