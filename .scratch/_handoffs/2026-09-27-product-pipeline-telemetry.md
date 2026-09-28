# Handoff: product → orchestrator (2026-09-27)

**Done:** grilled the user on pipeline telemetry and published `.scratch/pipeline-telemetry/spec.md` (ready-for-agent). The inspiration paper is D-Streams (Zaharia et al., SOSP 2013); the ACM PDF was blocked (403); its ideas are summarized in the spec.

**Next cell:** `orchestrator`. Break the spec into tracer-bullet tickets. Suggested order: fixture transcripts + incremental ingest/checkpoint, then attribution, then error clustering, then token/usage stats, then static HTML dashboard, then the `telemetry` skill + proposals, then the scheduled task.

**Brain gates still open:**
- Adding a cell/ticket tag to `organism-protocol` (skill change).
- CONTEXT.md terms: Telemetry, Error cluster, Savings proposal.
- Any dashboard dependency (default: none).

**Other open product work (not started, needs a fresh product session):** `_handoffs/2026-09-27-new-scope-for-product.md` (demo-able first version first) and `organism-infra/issues/04-jev-precheck-design.md`.

**Environment issues:** the ACM PDF returned HTTP 403 via WebFetch; the user supplied the title.

## Addendum (orchestrator, 2026-09-28)
The user wants an efficiency board in the UI: a usage-over-time graph plus efficiency metrics (5h % per resolved ticket, subagent tokens per ticket, bounces per ticket, wall time per ticket), each tagged with the loop config in effect. Data is being collected in `.scratch/usage.jsonl` from 2026-09-28; the schema is in the orchestrator genome. Fold this into the telemetry spec when it's un-parked, after the MVP.
Also: `incident` lines (tool, what, cost, fix, rule_change) so the board can show mistakes over time, repeat offenders by tool, and whether a rule change stopped them from recurring. The goal is learning from mistakes and improving tool use, not just measuring cost.
Also (2026-09-28): get cost and limits from the transcript jsonl plus a plan-limits poll, as AgentSystemLabs/agent-office does. See .scratch/_handoffs/refs/agentsystemlabs-agent-office.md (user, 2026-09-28).
