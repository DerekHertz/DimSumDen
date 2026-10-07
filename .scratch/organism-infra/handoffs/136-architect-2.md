# Handoff: 136 architect round 2 (ADRs, ledger, CONTEXT done; gated text pending)

Branch `docs/136-jev-go-live-amendment`, pushed through 10f0b4d. Done and committed: ADR 0010 Amendment 1, ADR 0015 Amendment 2 (conflicts C1-C7 now "how the user settled them"), ADR 0014 Amendment 1 (cold-hop cell list, scout rule), `docs/jev-usecases.md` rewritten, `CONTEXT.md` terms (Trial, Use case, Label set, Safety miss, Advisory mode, Config row, Wake-up gate, Reserved budget; Shadow mode no longer avoids trial).

## Build-ticket scopes (for the orchestrator to file, in this order)

- **A, route prep.** Normalize advisory-outcome aliases (`qa`=`qa-specify`, `developer`=`developer-direct`); add `security` label; code-built `state` header (Type, files touched, gated-path flags, relay defaults); sharper criteria text; atomic yes/no version composed in code; replay both on the 39 labelled tickets, keep the higher, go live only at 80% agreement; `config` row; then 10-ticket trial.
- **B, verify + config-row mode.** Lift the qa-unspecified floor (light at conf >= 0.8, tests green, risk-check clean); `jev.mjs` resolves each use case's mode from its latest `config` row (`decide` already gets `usageRows`); regression test that `effective` equals today's rule in every mode and fallback reason (ticket 160 fixed the shadow baseline; the old "bug logged 2026-10-05" is closed). First replay and report how many qa-unspecified tickets reach conf 0.8 (history: 0 of 52 light picks reached 0.8, max 0.74, 18 on unspecified tickets); if none, stop and ask the user about the floor.
- **C, wake live.** Config row; code wakes on any user-authored comment; floor 0.9 informational; trial judged on safety only.
- **D, priority/scope display.** Advisory mode, shown at the frontier proposal, does not feed the order; report promotion bars (70%/10 flags, 60% tercile/20, no small in top tercile).
- **E, tier retune.** Re-derive labels/thresholds from the 98 shadow rows; add `small`; Haiku 5.5 (`claude-haiku-5-5`) may take developer work on `small` at conf >= 0.8; replay on history (architect adjustment to a separate shadow run; user may overrule); one Haiku bounce turns lowering off; light verify on Haiku; check the Haiku 5.5 price against weight 0.5.
- **F, `log-cell --model`** on every dispatch (orchestrator genome text is gated, see below), so Haiku runs are weighted as Haiku.
- **G, security review 42** (un-parked, right after 136). Then: 74 criteria (escalate-only done-check), bounce routing, handoff trimming, diff input; each needs ADR 0010 decision 9 extended in writing.
- **H, finding information.** Start-here file to full qa verify, security, scout (`scripts/dispatch-prompt.mjs`, `dispatch-context.mjs` cell list); scout calls `jg` first.

## Pending (not done, context budget)

- Write the exact gated text for `.claude/agents/orchestrator.md` (replace the "In shadow" wording at steps 1, 5, 6, 3 with the config-row modes; add `--model` on `log-cell.mjs`; step 0 cell list per ADR 0014 Amendment 1), `.claude/agents/scout.md` (jg before grep as a rule), and `CLAUDE.md` if it names shadow rules, as a ticket section for the user to apply interactively without auto mode. The old patch `.scratch/_handoffs/gated/136-jev-go-live-genome.patch` targets an older orchestrator.md: regenerate against current main. Needs a fresh architect (or the orchestrator) that reads those two role files only.

```json
{
  "ticket": "organism-infra/136-jev-go-live-amendment",
  "cell": "architect",
  "current_step": "ADR 0010/0015/0014 amendments, ledger and CONTEXT.md committed and pushed (10f0b4d); build scopes in this handoff; gated .claude/CLAUDE.md text not written.",
  "artifacts": ["docs/adr/0010-jev-precheck-tier-and-verify-depth.md", "docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md", "docs/adr/0014-jevgrep-context-supply-at-dispatch.md", "docs/jev-usecases.md", "CONTEXT.md"],
  "decisions": [
    "Verify numbers recomputed: latest shadow pick per resolved ticket, 66 tickets, 52 light, 0 at >= 0.8 (max 0.74), 18 light picks on qa-unspecified tickets; the draft's 42 was a narrower slice. The lift may rarely fire, so build B replays first.",
    "ADR 0014 decision 3 'Which cells' replaced by Amendment 1; decision 4 scout hardened to a rule (scout.md already allows scripts/jg.mjs).",
    "Tier validated by replay, not a separate shadow run: architect adjustment, adjustable.",
    "Wake floor 0.9 kept as architect adjustment with reason."
  ],
  "failures": ["Context budget (80k) reached before the gated text was written; outcome: partial"],
  "pending": [
    {"item": "Write exact gated text for orchestrator.md, scout.md, CLAUDE.md into the ticket (regenerate against current main); do not apply", "owner": "architect"},
    {"item": "Orchestrator files build tickets A-H from this handoff", "owner": "orchestrator"}
  ]
}
```
