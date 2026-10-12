# Queue: a computed order for the frontier, with an admission gate

**Status:** draft. Decisions below were settled with the user in a grilling session on 2026-10-12 (orchestrator, four rounds). The user has not yet confirmed the summary. No tickets yet.

**Why:** the frontier order today is the orchestrator's own pick. ADR 0015 decision 4 defines an order in code (`rankFrontier` in `scripts/jev.mjs`: P, unblock count, scope, number) but it runs in shadow only and knows nothing of the north star. Nothing checks a ticket when it is filed, so P values are arbitrary and pipeline tickets pile up (organism-infra: 12 ready, 68 parked on 2026-10-12). The user wants an order that follows a rule, changes as work completes, and limits scope creep.

**Amends:** ADR 0015 decision 4 and Amendment 2 (frontier order). The architect writes the amendment. `CONTEXT.md` gains the term **Queue**.

## Decisions

1. **Shape.** The queue is a computed order: a function of each ready ticket's fields, recomputed whenever the board changes. There is no stored list.
2. **North star.** One feature is **active**. Its ready tickets outrank all others whatever their P.
3. **Active feature.** Only the user sets it, with one board command that writes a config row. Exactly one at a time. The orchestrator may propose a switch, never make it.
4. **Urgent lane.** Only P0 jumps the active feature. P0 means: `main` is red, the relay cannot run, or security found a high or critical. The board refuses P0 without one of those reasons named. P1 to P3 never cross the active-feature line.
5. **Order within a tier** (inside the active feature; separately among the rest): unblock count, then the P line, then the lowest ticket number. Scope is not used.
6. **Admission gate.** A ticket becomes ready only with a `Serves` line that names a real step of the active feature's spec or an incident that exists, and a class (product or pipeline). A pipeline ticket also needs three incidents. A ticket that fails is parked with the reason.
7. **Gate judge.** Code checks form and that the references exist; it does not judge meaning. No model call. The user can admit a refused ticket with a logged reason.
8. **Idle fill.** When the active feature has nothing ready, the orchestrator proposes the top gated ticket from the rest. The user still approves each dispatch. Being picked resets that ticket's decay count.
9. **Decay.** A ready ticket outside the active feature that is not picked while 5 tickets resolve is parked with the reason. Unpark restarts the count. Active-feature tickets never decay. This replaces the aging bump in ADR 0015 decision 4.
10. **Unplanned tickets.** Each feature records which tickets came from its approved spec; later ones are marked unplanned. The queue shows the count per feature. Once unplanned tickets pass a third of the planned ones, admitting another needs the user's yes. Security findings of medium or above still enter, and count.
11. **Go-live.** Applied from the start, no shadow period. The orchestrator must propose the top ticket; a deviation states why, the user decides, and it is logged.
12. **Visibility.** One read-only board command prints the order with one reason per line (tier, unblock count, P, decay count left) and the parked-by-gate list. The orchestrator pastes its top lines at each dispatch proposal. The Den kanban is a later ticket.
13. **Day one.** The gate runs once on every ready ticket. The user sees the list of failures before anything is parked and can admit exceptions.
14. **Term.** **Queue**: the frontier in its computed order, active feature first. The board stays the board; the frontier stays the unordered set.
15. **Timing.** Build this before agent-os/03 continues (the user's choice over building it as idle fill).

## Open for the architect

- Where class comes from (per feature, or a line on the ticket) and how "planned" is recorded for a feature with no spec.
- Where the active-feature row lives and how the board command refuses a non-user caller, if it can.
- Whether the order moves out of `scripts/jev.mjs` into the board CLI, and what happens to the `jev-order` shadow rows.
- The orchestrator genome changes (loop step 5 and 6); these are gated `.claude/` edits.
