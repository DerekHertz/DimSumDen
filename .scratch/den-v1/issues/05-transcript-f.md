# 05: F: the agent's live transcript from the card

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately; build and test on fixture events, live stream checked when organism-infra/106 lands)

**Status:** in-review

**Serves:** Den loop step 3 (F opens the live transcript).

## What to build

The live store in `apps/ui/src/state/` keeps a bounded per-agent ring buffer of the agent's events from the bridge SSE stream. **F** on the card opens a transcript panel for that agent: messages and tool calls, newest at the bottom, collapsible tool calls, still streaming while open. Esc or F again closes it. No new bridge route.

## Acceptance criteria

- [ ] Events for an agent append to its buffer; the buffer drops the oldest beyond its cap.
- [ ] The panel shows new events as they arrive while open.
- [ ] F on a card with no agent does nothing and the reason stays visible.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-04:** Dropped the `Blocked by` edge to den-v1/04 (user, 2026-10-04); 04 stays parked.
- **orchestrator, 2026-10-06:** Now blocked by den-layout (approved breakdown, user 2026-10-06): builds on PR #162's scene once real agents drive it.
- **orchestrator, 2026-10-07:** Design relay changed (user, 2026-10-07). Before qa specify: `designer` in `spec` mode works *with the user* on a very detailed spec, plus low-cost visuals (static mockups) the user signs off on or annotates. No designer `review` cell. After qa verify the ticket goes `ready-for-human` for the user's own visual critique; findings go to one developer fix round; the user's yes unlocks risk-check and the PR. Genome edit: organism-infra/182.
- **orchestrator, 2026-10-08:** User 2026-10-08: unblocked. All four criteria build and test on fixture events (feeds Demo mode, den-v1/09); the live stream is checked when organism-infra/106 lands. Add story 23 (token) to the criteria at qa specify.
- **designer, 2026-10-08:** Designer spec: DRAFT only, user has not signed off. See handoffs/05-designer-spec.md (6 open questions, ASCII sketch, no HTML mockup yet). Do not dispatch qa specify until the user signs off.
- **orchestrator, 2026-10-08:** The first designer spec cell returned partial (80k context budget); its draft spec is in `handoffs/05-designer-spec.md`. The user settled its six open questions (2026-10-08): (1) right side panel, with a bottom sheet under 600px; (2) buffer cap of 200 events per agent; (3) the panel stays pinned to its agent when the user walks away; (4) tool calls collapsed by default; (5) `Jump to latest (n)`, with no pause toggle; (6) walk mode only. Still to do: a fresh designer makes the static mockups for the user to sign off, then writes the final spec. Do not run qa specify until then.
- **designer, 2026-10-08:** Designer spec: mockup published https://claude.ai/artifact/TrxWBn9H1igYsiybKEctDa; six questions settled and folded in (handoffs/05-designer-spec-2.md). Awaiting the user's sign-off on the mockup; do not dispatch qa specify until then.
- **orchestrator, 2026-10-08:** The user signed off the mockup (https://claude.ai/artifact/TrxWBn9H1igYsiybKEctDa) with no notes. They also approved three details as drawn: the role beside the state in the header, a 32px Close on desktop (44px on phone), and the `Jump to latest (n)` pill at the bottom centre. The final spec is `handoffs/05-designer-spec.md` plus the changes in `05-designer-spec-2.md`. At qa specify, add story 23: opening, streaming and closing the transcript makes no network request.
