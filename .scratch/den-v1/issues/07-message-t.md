# 07: T: send an agent a message from the card

**Type:** feature

**Priority:** P1

**Blocked by:** organism-infra/107, den-layout/03

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 (T sends a message; the agent receives it).

## What to build

**T** on the card opens a text box; Enter sends the text (at most 2 KB) with `POST /agents/:id/message` (ADR 0016's message route, named `/agents` under ADR 0019 decision 10) through the bridge client. The card shows the message as sent, then received once the agent's event stream acknowledges it. Disabled with the reason when the runtime cannot send.

## Acceptance criteria

- [ ] Enter sends exactly one request with the text and the token; Esc cancels without sending.
- [ ] Text over 2 KB is refused in the UI before sending.
- [ ] The card shows sent, then received when the acknowledgement event arrives.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-04:** Dropped the `Blocked by` edge to den-v1/04 (user, 2026-10-04); 04 stays parked.
- **orchestrator, 2026-10-06:** Now blocked by den-layout (approved breakdown, user 2026-10-06): builds on PR #162's scene once real agents drive it.
- **orchestrator, 2026-10-07:** Design relay changed (user, 2026-10-07). Before qa specify: `designer` in `spec` mode works *with the user* on a very detailed spec, plus low-cost visuals (static mockups) the user signs off on or annotates. No designer `review` cell. After qa verify the ticket goes `ready-for-human` for the user's own visual critique; findings go to one developer fix round; the user's yes unlocks risk-check and the PR. Genome edit: organism-infra/182.
