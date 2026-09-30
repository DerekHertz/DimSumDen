# 70: S2b: Route shadow for bounces

**Type:** feature

**Priority:** P2

**What to build:** Extend `route` to bounces (label set `developer | qa | architect | user | other`), in shadow. Held until security (67) rules on sending handoff text; build to whatever input 67 allows (for example the bounce verdict comment plus the ticket).

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** 67, 69

**Status:** ready-for-agent

- [ ] `jev.mjs` accepts a route request for bounces with exactly the label set above; any other model output maps to `other`.
- [ ] Input sent is exactly what ticket 67 allowed (tested); existing redaction and blocked-input fallback apply.
- [ ] No bounce label would skip a verify or security stage the state machine requires (tested).
- [ ] Rows log the label; `jev-report.mjs` reports bounce agreement per label and the bounce-half go-live bar (ADR 0015 decision 5, at least 8 bounce rows) as pass/fail lines.
- [ ] Nothing routes live; no gate is touched.

## Comments
