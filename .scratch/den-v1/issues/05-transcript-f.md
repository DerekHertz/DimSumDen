# 05: F: the agent's live transcript from the card

**Type:** feature

**Priority:** P1

**Blocked by:** organism-infra/106, den-layout/03

**Status:** ready-for-agent

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
