# 233: The den defaults to the first agent needed

**Type:** feature

**Priority:** P1

**Status:** ready-for-agent

**Source:** architect

**Class:** product

**Origin:** added

**Blocked by:** 232

**Serves:** Den loop (ADR 0022 decision 2). The user's request: "the default in the drop down was the first agent needed".

## What to build

Slice 1, ticket C of ADR 0022 (`docs/adr/0022-relay-through-the-bridge.md`, accepted by the user 2026-10-12). A UI ticket: the user gives the visual verdict.

The hub adds `relay: { "<ref>": { next, stop } }` to the snapshot (additive; `next` is the planner's hop role and mode, `stop` its kind and reason). `defaultRole(ticket, relay)` in `apps/ui/src/overlay/run-model.mjs` returns the planned role when there is one, else today's type map; `ROLE_OPTIONS` for a ticket include the planned hop's role. The select shows the planned mode beside a `qa` role (for example "qa, verify"). A stale snapshot's 409 text is shown as the Run control's existing error line.

No other UI change: no Stop control, receipt or approval reason (organism-infra/230). No designer spec beyond the label, since the control exists (organism-infra/228).

## Acceptance criteria

- [ ] `run-model.test.mjs`: a ticket with `relay.next` `developer` defaults to developer and the select offers it; a ticket with none keeps today's map; a relay-hop role is never offered when the plan is something else.
- [ ] A bridge test: the snapshot's `relay[ref].next` equals what `POST /agents` accepts for the same ref.
- [ ] A recorded live check: start a developer hop from the den on a small ticket; note every permission request and refusal by cause (board calls, file, shell) and the token cost. This is the data for ADR 0022 decision 5 (the user chose to measure before granting anything).
- [ ] The user's visual verdict (`ready-for-human`).
- [ ] `npm test` green.

## Expected files

`apps/bridge/snapshot.mjs`, `apps/ui/src/overlay/run-model.mjs`, `apps/ui/src/overlay/Cards.jsx`, tests.

## Comments

- 2026-10-12, orchestrator: filed from the architect's draft in `.scratch/organism-infra/handoffs/229-architect.md` after the user accepted ADR 0022. Shares `Cards.jsx` with organism-infra/230: do not run the two at once.
