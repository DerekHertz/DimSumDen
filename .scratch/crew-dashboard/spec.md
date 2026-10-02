# Crew dashboard: a role-centric view of the den, with role contracts

Status: ready-for-agent (spec); tickets not yet published. The test seams below are proposed and need the user's confirmation before the orchestrator breaks this into tickets.

Source: the user's video of the agent-office idea that sparked DimSumDen (a Codex write-up, 2026-10-01). Its first screen is a "The crew" page: one card per agent with its responsibility, trigger, last run and Talk / Run now / Details buttons. The user asked for this view and for explicit role contracts (conversation, 2026-10-01). Decision: the Front of House door guard is a skin on Needs you (A); a real gatekeeper role (B) is parked.

## Problem Statement

The user can see tickets (the Board) and pandas (the den), but cannot answer "what does each role do, when does it run, what did it last do, and what has it cost?" without reading genome files and transcripts. A cell given a vague order has no defined way to say "nothing to do" or "I need to ask first", so it either guesses or burns tokens, and the UI cannot show that outcome. A message sent to a running cell shows no sign of whether it was received.

## Solution

A third view, the **Crew**, next to the den and the Board. One **role card** per cell type: its station, nickname, responsibility, minimum tier, how it is triggered (manual, relay step, or schedule), last run (outcome, time, cost) and totals. Each card has Details (the recipe card: genome contract) and Talk (opens the steering composer for that role). Genomes gain a short, explicit contract: what the role does, what it refuses, and its outcomes including **no-op** and **clarify**. A cell ending with no-op or clarify is a first-class result, shown on the card and the Board. A message sent to a live cell shows as queued, then acknowledged, then applied.

## User Stories

1. As the user, I want a Crew view listing every role, so that I can see the whole team without opening genome files.
2. As the user, I want each role card to show its station, nickname and one-line responsibility, so that I recognize it.
3. As the user, I want each card to show how the role is triggered (manual, a relay step, or on a schedule), so that I know what starts it.
4. As the user, I want each card to show the last run: outcome, how long ago, ticket and cost, so that I can spot a role that is failing or idle.
5. As the user, I want per-role totals (runs, tokens, cost) from telemetry, so that I can see where the plan usage goes.
6. As the user, I want a "Next up" strip of scheduled or ready work per role, so that I know what will run soon.
7. As the user, I want Details to open the recipe card (contract, gates, done criteria, tools, minimum tier), so that I can check what a role is allowed to do.
8. As the user, I want a Talk button on a role card that opens the composer aimed at that role, so that I can give it a task directly.
9. As the user, I want Talk to be disabled, with the reason shown, when the runtime cannot spawn that role, so that I am not offered a dead control.
10. As the user, I want dormant roles (planned, no genome yet: release manager, docs writer, and so on) shown as "coming online", so that the map of the team is complete.
11. As the user, I want a role in the "no-op" outcome to read "nothing to do: <reason>", so that a vague order is not mistaken for a failure.
12. As the user, I want a role in the "clarify" outcome to appear under Needs you with its question, so that I answer it once and the cell continues or restarts with the answer.
13. As the user, I want a no-op or clarify run to still show its cost, so that I see that even an empty answer is not free.
14. As the user, I want a message I send to a running cell to show as queued, acknowledged, then applied, so that I know the cell heard me.
15. As the user, I want to cancel a queued message before it is applied, so that I can retract a mistaken steer.
16. As the user, I want the Crew view reachable from any zoom level and by keyboard (Ctrl K), so that it is one step away.
17. As the user, I want the Crew view complete on a 375px phone screen as a plain list, so that I can check the team on my phone.
18. As the user, I want the Crew view to work in Demo mode with fixture data, so that I can show it to others with no live agents.
19. As the user, I want a role with an unmet precondition (no ticket, no spec) to say so on its card, so that I know why it is not running.
20. As the user, I want the Crew view to be the same data as the den and Board, never a separate copy, so that the three never disagree.
21. As the user, I want Needs you items to carry a Front of House door-guard skin in the den (a lantern or guard at the entrance, count on the badge), so that waiting items are findable in the scene as well as the list.
22. As the orchestrator, I want each genome to declare its contract in a machine-readable block, so that dispatch can check an order against it.
23. As a developer cell, I want the no-op and clarify outcomes recorded in the handoff State block, so that the next cell and the UI read one field.

## Implementation Decisions

- **Contract block in the genome.** Optional additive keys under the genome's `organism:` block: `triggers` (a list of `manual`, `relay:<step>`, `schedule:<cron or label>`), `refuses` (a short list of orders the role declines), `outcomes` (the allowed end states: `done`, `noop`, `clarify`, `blocked`, `failed`). Existing genomes keep working with none of the keys; the Crew view then shows "trigger: manual" and omits Refuses. All nine existing genomes get the block as part of this spec's tickets.
- **Outcome vocabulary.** Two new handoff State values, `noop` (nothing to do, with a one-line reason) and `clarify` (a question for the user). `clarify` becomes a Needs-you item of its own kind beside pass gates and permission requests; it is not a pass gate, and answering it is a steering command.
- **Snapshot gains a `crew` key (additive).** The bridge builds it from the genomes plus telemetry plus the board events: per role, the contract fields, last run, totals, and planned-but-genomeless roles from a short list. No new reader of transcripts: totals come from the existing telemetry.
- **Crew model.** A pure view-model (like the existing dashboard and queue models) turns the snapshot's `crew` key into role cards and the Next-up strip. The React component only draws it.
- **Talk reuses the steering channel (ADR 0016).** No new route: Talk is the existing dispatch or send command with the role preselected. The runtime's capability set decides whether Talk is enabled.
- **Queued / acknowledged / applied** is a field on the message record the bridge already holds for `send`. The cell process reports acknowledgement when the message is consumed into a turn. Cancel is allowed only while queued. Where the runtime cannot report acknowledgement, the state stays "queued" and the card says "delivery not confirmed".
- **Door guard skin.** A visual treatment of the existing Needs-you count at the den's entrance, owned by the designer. It adds no new data and no new approval path; a gate request still proves nothing about who wrote it.
- **UI names.** The view is "the Crew"; a role card is a "role card"; details are the "recipe card". `CONTEXT.md` gains Crew, Role card, Outcome (noop, clarify) and the UI-names rows.
- **Placement.** The Crew view is a view toggle beside the Board toggle, not a fifth zoom level.
- **Designer first.** The role card and the Crew layout need a designer spec and user verdict on mockups before any visual code (the user's standing rule).

## Testing Decisions

- A good test drives the public seam and checks external behavior: the snapshot's `crew` key for given genomes, telemetry and board events; the crew model's cards for a given snapshot. No test reads private helpers or component internals.
- **Seam 1 (highest): `buildSnapshot` output.** Fixture root with genomes, telemetry rows and events, asserting the `crew` key: contract fields, last run, totals, dormant roles, no-op and clarify outcomes. Prior art: `apps/bridge/bridge-state.test.mjs` and `bridge-metrics.test.mjs` with `bridge-fixture.mjs`.
- **Seam 2: the crew view-model**, snapshot in, cards out (disabled Talk and its reason, Next-up ordering, empty and missing fields). Prior art: `apps/ui/src/panel/dashboard-model.test.mjs`, `queue-model.test.mjs`.
- **Seam 3: message delivery state** through the fake runtime of ADR 0016: queued, acknowledged, applied, cancelled-while-queued, and unconfirmed.
- **Genome validity** is covered by the existing mechanical genome checks (ADR 0009), extended to accept and validate the new keys.
- Human-verified: card layout, door-guard look, phone layout.

## Out of Scope

- Meetings and the decision brief: ADR 0017 and a later spec.
- **Front of House as a real gatekeeper (B).** A role that screens inbound requests or external input. Parked for future scope; it needs its own spec and a threat model with `security`.
- Roaming pandas, leisure zones (cinema, karaoke, ball pit), the self-destruct prank: low priority, eventual goals. Roaming reverses the 09-29 "pandas never roam" decision and needs a design session first.
- Voice input (push-to-talk): eventual goal; it would feed the intent bar and steering `send`.
- A free-walk first-person camera over the den (expensive); the L3 and L4 zoom stays as designed.
- New cell types (code reviewer, SRE, release manager, docs writer): only shown as dormant cards.
- Schedules that actually run: this spec shows a declared trigger and Next-up; running a schedule is a separate ticket.
- Infra health view ("the Box").

## Further Notes

- The existing `Dashboard.jsx` is the usage-charts panel (ui-v0/11); do not confuse it with the Crew view. Reuse its tokens and chart components for per-role totals.
- Video findings worth keeping for the designer: a role card shows responsibility before the character; hover cards give state plus shortcuts; bursty tool labels merge into a count; cost shows beside the result.
- Candidate tickets (orchestrator to confirm): 1) genome contract block plus mechanical check; 2) outcome vocabulary in handoff State; 3) snapshot `crew` key; 4) designer spec and mockups for the Crew view; 5) crew view-model and component; 6) Talk from a role card; 7) message delivery state; 8) door-guard skin on Needs you.
