# 11: Dashboard: three charts and a usage tile

**Type:** feature

**Priority:** P1

**What to build:** Inline-SVG charts, no chart dependency, following the `dataviz` skill: throughput per 5-hour window, tokens per resolved ticket by cell type, incidents per ticket by tool; plus a usage tile. Data from metrics as the 01 ADR decides. Designer reviews after qa.

**Blocked by:** 03, 07

**Status:** resolved

- [ ] Charts render from fixture metrics with correct values in labels (test)
- [ ] Empty metrics show an empty state, not an error (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **orchestrator, 2026-09-29:** Scope add (orchestrator, 2026-09-29): ADR 0011 decisions 4 and the route table require GET /metrics (200, exactly computeMetrics output from scripts/metrics.mjs over .scratch/usage.jsonl and events.jsonl) and a payload-free SSE metrics-changed event when either log changes. No ticket owned them, so the dashboard shows 'Metrics unavailable' against the live bridge. Add both here, test-first, in apps/bridge.
- **qa, 2026-09-29:** QA pass: 644/644, specify tests unchanged, both criteria and GET /metrics scope add covered; SVG render is designer-verified.
- **security, 2026-09-29:** Security pass. No critical/high. Low: scripts/metrics.mjs:37 cell '__proto__' makes /metrics 500 (use Object.create(null)/Map); server.mjs:56 reads full logs per request, events.jsonl unused. Handoff: handoffs/11-security.md
