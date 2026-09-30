# 79: Route advisory-live: show Jev's pick at the dispatch gate

**Type:** feature

**Priority:** P1

**What to build:** Move the `route` point (69 new-ticket, 70 bounce) from shadow to advisory-live. When the orchestrator proposes a dispatch, it runs `jev.mjs route` (or `route-bounce`) and shows Jev's pick and confidence next to its own. The user still approves every dispatch, and Jev never picks the cell on its own. Log each outcome as a row that `jev-report.mjs` reads: the orchestrator's pick, Jev's pick, the user's final choice, and whether the dispatched cell later bounced. Advisory mode is exempt from the ADR 0015 go-live bars. Those bars still gate the step where Jev's pick is applied without asking; the advisory rows are the data for revisiting them. Record this as an ADR 0015 amendment (architect, user's yes).

Genome change (`.claude/agents/orchestrator.md`): the dispatch step shows the route pick. Cells can't edit `.claude/`, so the developer writes the exact edit into its handoff and the user applies it.

**Blocked by:** 70

**Status:** ready-for-agent

- [ ] `jev.mjs route --mode advisory` returns the pick and confidence and logs an `advisory` row; the shadow rules for other points are unchanged (tests)
- [ ] An outcome row records orchestrator pick, Jev pick, user choice, and later bounce; `jev-report.mjs` prints advisory agreement per label (tests)
- [ ] A Jev outage, missing key or cap still exits 0 and the dispatch proceeds without a pick (test)
- [ ] Genome edit and ADR 0015 amendment written for the user to apply

## Comments

- **Created (orchestrator, 2026-09-30):** User chose advisory-live route testing so real runs can inform the go-live thresholds.
- **orchestrator, 2026-09-30:** Scope added (orchestrator, from 71): wire orderRow so the dispatch step logs actual vs Jev frontier order, and record the user's verdict on each priority flag as a jev-priority-verdict row. Both were deferred from 71 by qa verify.
