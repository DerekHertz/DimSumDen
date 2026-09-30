# 69: S2a: Route shadow for new tickets, plus reserved budget

**Type:** feature

**Priority:** P1

**What to build:** Add the `route` point to `jev.mjs` for new tickets (label set `product | architect | designer | qa-specify | developer-direct | user | other`), in shadow, plus per-point reserved budget inside the shared $0.50 cap (ADR 0015 decisions 3 and 7; spec open question 4 resolved: floors ride with this slice). New-ticket route sends the ticket only, which ADR 0010 already allows, so it does not wait on 67. The bounce half is ticket 70.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] `jev.mjs` accepts a route request for new tickets with exactly the label set above; any other model output maps to `other`.
- [ ] Route never fires where the state machine dictates the next cell (tested); code removes forbidden labels before the call, and `developer-direct` is never offered on a code ticket (ADR 0015 decision 3).
- [ ] Each call logs the label to `usage.jsonl`; shadow stdout does not show the pick to the orchestrator; the report reads the actual dispatch from the next board claim on that ticket (or logs `actual` from the orchestrator and says so if claim events lack the cell type); `jev-report.mjs` reports agreement per label.
- [ ] Per-point daily reserved budget ($0.05 each for tier, verify, route) inside the shared $0.50 cap; a point over its reservation draws only from the shared remainder (tested). Failure or blocked input falls back to "orchestrator decides"; out of budget logs `fallback:"cap"`.
- [ ] The route go-live bar (ADR 0015 decision 5, now accepted) is encoded in the report as pass/fail lines for the new-ticket half.
- [ ] Nothing routes live; no gate is touched.

## Comments
