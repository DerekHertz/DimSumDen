# 229: Run a ticket's relay through the bridge

**Type:** design-question

**Priority:** P1

**Class:** product

**Blocked by:** none

**Status:** resolved

**Serves:** Den loop: the user starts the agent a ticket needs from the Den, and the next hop is routed without the user driving a terminal session.

## What to build

A design, as an amendment to ADR 0016 (or a new ADR), for running a ticket's relay through the bridge. Raised by the user on 2026-10-12 during the visual verdict on organism-infra/228; the user chose to merge 228 as built and design this next.

The user's two requests, in their words:
- "since i'd like to just dispatch the agent needed for a task directly, it would be nice if the default in the drop down was the first agent needed."
- "after completing the task it should trigger some even that wakes up orchestrator/bao and then it can be routed to the next task and so on"

What exists today:
- `POST /agents` refuses `developer`, `qa` and `security` with 409 "dispatch the orchestrator, which runs the relay" (`RELAY_HOP_ROLES` in `apps/bridge/cells/policy.mjs`; ADR 0016 decision 3.5). The den's Role select therefore offers only orchestrator, architect, product, designer, scout and herald (`apps/ui/src/overlay/run-model.mjs`).
- ADR 0016 lists "Slice 3 (optional): direct relay-hop dispatch", to come once the orchestrator's hop logic (base SHA, Jev tier, verify depth) is a callable module rather than genome prose.
- An agent ending frees its slot and writes an `end` row to `.scratch/_run/sessions.jsonl`. Nothing reads that row to start the next hop.
- scout, developer, qa and security have a ceiling in `apps/bridge/cells/ceilings.json` and run with no permission request inside their worktree (agent-os/04). orchestrator, architect, product, designer and herald have no ceiling, so every request from them asks the user.

Questions the design must answer:
1. Direct dispatch of relay-hop roles: what the bridge needs to start qa `specify`, developer, qa `verify` and security on a ticket (base commit, branch, mode, model tier), and where that hop logic lives.
2. The default role: how "the first agent needed" is decided for a ticket (ticket type, relay state from handoffs, Jev's route), and what the select offers.
3. The finish event: what fires when an agent ends, who decides the next hop (an orchestrator session the bridge wakes, or bridge code), and how a failed or partial hop is handled.
4. Which steps still stop for the user: ticket approval, visual verdicts, scope questions, a twice-failed ticket, the usage stop, the merge.
5. Ceilings for the five roles with none, the orchestrator first, so a den-started relay does not ask the user to approve every request.
6. Slices: the smallest first slice the user can use from the Den.

## Acceptance criteria

- [ ] An ADR amendment or new ADR answers the six questions, with the alternatives considered.
- [ ] The user has read it and said yes.
- [ ] Build tickets are filed for the first slice.

## Comments

- 2026-10-12, orchestrator: filed at the user's choice ("Merge, then design it") after PR #240 merged. Proposed cell: architect.
- **orchestrator, 2026-10-12:** User read the design summary and answered all seven decisions with option (a), 2026-10-12. ADR 0022 marked accepted (128d1ca), PR 241. Slice 1 filed as 231, 232, 233.
