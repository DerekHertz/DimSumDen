# 70: S2b: Route shadow for bounces

**Type:** feature

**Priority:** P2

**What to build:** Extend `route` to bounces (label set `developer | qa | architect | user | other`), in shadow. Held until security (67) rules on sending handoff text; build to whatever input 67 allows (for example the bounce verdict comment plus the ticket).

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** 67, 69, 77

**Status:** resolved

- [ ] `jev.mjs` accepts a route request for bounces with exactly the label set above; any other model output maps to `other`.
- [ ] Input sent is exactly what ticket 67 allowed (tested); existing redaction and blocked-input fallback apply.
- [ ] No bounce label would skip a verify or security stage the state machine requires (tested).
- [ ] Rows log the label; `jev-report.mjs` reports bounce agreement per label and the bounce-half go-live bar (ADR 0015 decision 5, at least 8 bounce rows) as pass/fail lines.
- [ ] Nothing routes live; no gate is touched.

## Comments
- **orchestrator, 2026-09-30:** Now blocked by 77 per 67's security verdict.
- **developer, 2026-09-30:** db370c0: route-bounce CLI + bounce report; npm test 1019/1019; risk-check hits in qa test files
- **qa, 2026-09-30:** QA pass: 1019/1019 pass, 0 fail; specify tests untouched; all 5 criteria covered or human-verified; jev-bounce-comment.test.mjs adds coverage only; risk-check hits in qa test files, security due.
- **security, 2026-09-30:** Security pass. latestBounceComment reads only bounce verdict comments (op:comment, verdict:bounce); no handoff or other event text reaches Jev. exposure.mjs hasSecret+BOUNCE_CAP+MAX_CHARS checks apply. Budget handling sound (route-bounce shares route reservation, cap fires before transport). No-bounce empty verdict: acceptable as-is in shadow mode. Gitleaks clean. 0 vulnerabilities. Low: jev.mjs:343 empty bounceComment wastes one Jev call on no-bounce tickets; not blocking.
