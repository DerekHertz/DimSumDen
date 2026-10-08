# 06: A/D: approve or deny from the card (UI against a stub bridge)

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately; den-layout/03 resolved)

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 (answer a pending permission request; the agent continues).

## What to build

When the card's agent has a pending approval, **A** and **D** first show the full tool input (`GET /approvals/:id`, token required), then send `POST /approvals/:id` with `allow` or `deny` through the bridge client in `apps/ui/src/state/`. The card shows the refusal reason if the bridge refuses.

This ticket builds and tests the UI against a stub bridge client and fixture events; den-v1/10 wires it to the live runtime (organism-infra/106) and checks the panda continues.

## Acceptance criteria

- [ ] A then confirm sends exactly one allow request to the right route with the token; D sends deny.
- [ ] The tool input is shown before any decision is sent.
- [ ] A refused request shows the bridge's reason and changes nothing.
- [ ] Tests run against a stub bridge client and fixture events; no live runtime is needed.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-04:** Dropped the `Blocked by` edge to den-v1/04 (user, 2026-10-04); 04 stays parked.
- **orchestrator, 2026-10-06:** Now blocked by den-layout (approved breakdown, user 2026-10-06): builds on PR #162's scene once real agents drive it.
- **orchestrator, 2026-10-07:** Design relay changed (user, 2026-10-07). Before qa specify: `designer` in `spec` mode works *with the user* on a very detailed spec, plus low-cost visuals (static mockups) the user signs off on or annotates. No designer `review` cell. After qa verify the ticket goes `ready-for-human` for the user's own visual critique; findings go to one developer fix round; the user's yes unlocks risk-check and the PR. Genome edit: organism-infra/182.
- **orchestrator, 2026-10-08:** User 2026-10-08: split. This ticket now builds and tests the UI against a stub bridge and fixture events, unblocked; the live wiring moved to den-v1/10.
