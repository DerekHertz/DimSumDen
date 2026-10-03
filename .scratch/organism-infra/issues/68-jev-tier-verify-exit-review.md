# 68: S1: Tier and verify exit review (ADR 0010)

**Type:** review

**Priority:** P1

**What to build:** Judge Jev's two existing points against ADR 0010's exit criteria and record a verdict for each (live, stay shadow, or drop). Blocks nothing in shadow; it gates S5 (via the jg route) and S6.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] Orchestrator judges the 2 bounces per point from the handoffs and records tier and verify verdicts (live, stay shadow, or drop) with the current numbers as the baseline (tier: 24 tickets, 3 fallbacks, +11.7% tokens; verify: 20 tickets, 0 fallbacks, -5.5% tokens, median about 450 ms).
- [ ] `jev-report.mjs` output supports the verdict without hand computation.
- [ ] The verdict is recorded on the board; any live switch needs the user's yes.

## Comments
- **orchestrator, 2026-09-30:** Verdicts (orchestrator, 2026-09-30, evidence from scout): tier STAY SHADOW: 24 tickets, 3 fallbacks, median 436 ms, 2 bounces (dimsumden-ui-v0/07, organism-infra/41), neither caused or avoidable by the pick; value fails (+11.7% tokens vs -30% needed). verify STAY SHADOW: 20 tickets, 0 fallbacks, median 468.5 ms, same 2 bounces unrelated to depth; value fails (-5.5% vs -30%). No live switch. Criterion 2 NOT met: jev-report prints bounces but not their cause or a per-criterion PASS/FAIL, so the safety judgement needed hand reading. Ticket stays open until jev-report prints that.
- **orchestrator, 2026-09-30:** Batch B: criterion 2 runs in batch B with 47; criteria 1 and 3 are orchestrator work after merge.
- **qa, 2026-09-30:** qa specify: 11 failing tests for criterion 2 on tests/batch-B @ 77ea34b (jev-report-exit-criteria.test.mjs). Batched with 47; one relay. Handoff: 68-qa-specify.md.
- **developer, 2026-09-30:** developer
- **qa, 2026-09-30:** QA pass (criterion 2). 1274/1274 tests pass (0 skip). All 11 jev-report-exit-criteria.test.mjs tests pass without modification. QA test file byte-for-byte identical to specify commit 77ea34b. Criteria 1 and 3 remain for orchestrator post-merge. See handoff 68-qa-verify.md.
- **security, 2026-09-30:** Security pass. Batched with organism-infra/47; see 47-security.md for full review. gitleaks: no leaks. npm audit: 0 vulns. No new deps, no CI changes. All risk-check hits are false positives or security improvements. No critical or high findings.
- **orchestrator, 2026-09-30:** criterion 2 merged in PR 100; criteria 1 and 3 are orchestrator verdict work
- **orchestrator, 2026-10-02:** Retro: the pending item in handoffs/68-orchestrator.md names organism-infra/11, which is resolved. Nothing left to do.
- **orchestrator, 2026-10-02:** Retro: on ticket 98, `jev verify` returned effective=full although qa had run specify (the genome rule says light). Check how verify detects a qa specify handoff when 68's follow-up is next worked.
- **orchestrator, 2026-10-03:** Re-scoped (refocus 2026-10-02, docs/refocus/triage-2026-10-02.md): verify goes live now, judged by bounce rate and tokens per ticket against the 10 tickets before it, with fallback to full verify on any red test; tier stays in shadow (live would move ~60% of runs from sonnet to opus). Agreement with the orchestrator is no longer the bar.
