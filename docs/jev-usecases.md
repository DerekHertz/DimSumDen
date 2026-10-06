# Jev use cases: ledger

One entry per use case. Terms come from ADR 0010 Amendment 1 and ADR 0015 Amendment 2 (2026-10-05, organism-infra/136); read those for the authority rules (Jev picks only among allowed options, may raise and never skip, never bypasses a gate, the user approves every ticket). Nothing below is live until the go-live ticket merges and appends a `config` row per use case. The start date is that row's `ts`.

## Shared rules

**Trial.** A use case runs on 10 resolved tickets on which it fired (a `jev` row at that point in the use case's mode, no fallback), then gets one keep-or-kill verdict from the user, on the `jev-report.mjs` section for that use case. If it has not reached 10 after 20 resolved tickets, the verdict is made on what exists. At most one acting use case per hop at a time, so a change in tokens has one cause: qa done-check starts only after verify's verdict, since both act on qa verify.

**Kill.** One safety miss, defined per use case below, turns the use case off at once: the orchestrator appends a `config` row with `mode: off` and the reason, and `jev.mjs` reads it (ADR 0010 Amendment 1). Beyond that, a use case is killed at the verdict if its measure is worse than its baseline.

**Config row** (one per go-live, keep and kill; appended by a `jev.mjs` command, never by hand):

```json
{"kind":"config","ts":"...","jev_usecase":"verify","mode":"live|shadow|advisory|off","conf_floor":0.65,
 "baseline":{"tickets":["feature/NN-slug"],"median":0,"mean":0,"bounces":0},"reason":"go-live|keep|kill|safety-miss: <ref>"}
```

The baseline is computed once, at go-live, and frozen in the row, so later rows cannot move it.

**Baseline** (the measure in the user's point 6: weighted tokens per resolved ticket against the last 10 tickets before go-live, bounce rate no worse). Computed from `.scratch/usage.jsonl`:

- *Rows.* `kind:"resolved"` (one per resolved ticket, in file order, which is chronological; `bounces` is its bounce count), joined by ticket key (`feature/NN-slug`, as `jev-report.mjs` keys it) to `kind:"cell"` rows. Lines that are not valid JSON are skipped (line 1182 of the file today is corrupt, with terminal colour codes inside a `usage` row). Rows with `backfill: true` and `cell_backfill` rows are ignored.
- *Which tickets.* The last 10 `resolved` rows before the go-live `config` row that have at least one `cell` row with `tokens` above 0 (tickets 110, 111 and 122 resolved with no cell rows, so they are skipped) and belong to the use case's class: for `verify` and `tier`, at least one `developer` cell row; for `route` and `wake`, any ticket with tokens; for qa done-check, at least one `qa` cell with a `verify` mode. The trial's tickets are chosen by the same class rule.
- *Weighting.* A ticket's weighted tokens are the sum, over its `cell` rows, of `tokens` times the weight of the row's model: haiku 0.5, sonnet 1, opus 2 (ADR 0010 decision 10). The model is the row's `model` field with the `claude-` prefix and version dropped (`claude-sonnet-5-5` is sonnet); when the field is absent, the genome default: scout haiku, designer, debugger and orchestrator opus, every other cell sonnet. Only 31 of 321 cell rows carry a model today, so a Haiku dispatch logged without `--model` is counted as sonnet; the go-live ticket makes the orchestrator pass `--model` to `log-cell.mjs` on every dispatch. Jev's own cost is API credit, not plan tokens, and is reported beside the measure, not in it. The orchestrator's own tokens are not logged (ADR 0019), so a saving there is not in the measure.
- *Statistic.* The median of weighted tokens per ticket is the measure; the mean is shown beside it. A mean is not used for the verdict because one ticket can dominate: `den-scene-v1/11` alone weighs about 2.1M of the recent window.
- *Bounce rate.* The sum of `bounces` over the same 10 tickets. "No worse" is a trial total at or below the baseline total.
- *Keep needs both:* trial median weighted tokens at or below the baseline median, and trial bounces at or below the baseline bounces.

**Confidence floor.** A live pick below its floor falls back (the orchestrator's own rule). The default is 0.8 (point 7). Every other floor has a reason in its entry. The raising direction (a pick that adds verification or a stronger model) needs no floor where noted, since falling back to today's rule is never safer than applying it.

## Live use cases

### verify (live)

- **Start date:** the go-live `config` row. **Mode:** live. Replaces today's rule on a qa-specified ticket: Jev's `full` pick raises light to full; `light` applies only when the rule already allows it (qa specified, ticket 58's floor), with the audit that a red test falls back to full (ADR 0019).
- **Sent to TypeSafe:** the ticket markdown and the developer's test output (`--tests`), tail-truncated to 16k characters (ADR 0010 decision 9). **Touches:** the qa verify dispatch depth and model (light on Haiku, full on Sonnet). Nothing else.
- **Measure:** the shared measure over developer-class tickets. Under the floor it can only match or raise today's rule (ADR 0015 Amendment 2, C3), so the verdict is "no worse" plus safety, not savings.
- **Baseline:** the last 10 developer-class resolved tickets before go-live.
- **Kill condition:** a ticket where `light` was applied and full verify (or `security`) would have found something that a light verify missed, judged by the orchestrator from the handoffs, or a trial median above baseline, or more bounces.
- **Confidence floor:** `light` at 0.65, `full` at any confidence. Reason: all 42 shadow `light` picks (resolved tickets) were below 0.8 (median 0.69, 75th percentile 0.72), so 0.8 would apply none; confidence does not separate outcomes here (light picks: 7 of 42 tickets bounced; full picks: 1 of 8; these are whole-ticket bounces, not verify-specific), so the floor is a noise filter and the real guards are the audit and the kill rule.

### route, new-ticket half (live)

- **Start date:** the go-live `config` row. **Mode:** live. The orchestrator proposes Jev's pick as the dispatch proposal; the user approves every dispatch as today. The bounce half stays advisory.
- **Sent to TypeSafe:** the ticket markdown only. **Touches:** the orchestrator's first-cell proposal for a ready-for-agent ticket, and one `jev-advisory-outcome` row per dispatch (orchestrator pick, Jev pick, the user's choice, bounced).
- **Measure:** the shared measure over any ticket with tokens, plus the **override rate**: dispatches where the user chose a cell other than Jev's pick, out of the trial's 10. The saving (the Opus judgment the orchestrator no longer spends) is not in `usage.jsonl`.
- **Baseline:** the last 10 resolved tickets with tokens; the override reference is the advisory data: Jev's pick differed from the user's choice on 4 of 15 rows (3 of 15 reading row 102's `qa` as `qa-specify`).
- **Kill condition:** a pick that would skip a required cell (for example a dispatch of Jev's `developer-direct` on a ticket that needed qa tests), or 4 or more overrides in 10, or a ticket whose wrong first cell is named as the cause of a bounce.
- **Confidence floor:** 0.8. Reason: confidence did not separate agreement in the advisory data (5 of 7 at 0.8 or more, 6 of 8 below; 6 of 7 at 0.8 or more reading row 102 as `qa-specify`), so there is no evidence to move the default; of 23 shadow picks only 9 reach 0.8, so Jev's pick is the proposal for about 4 tickets in 10 and the orchestrator decides the rest as today. Revisit at the verdict.

### wake (live)

- **Start date:** the go-live `config` row. **Mode:** live. An `informational` label suppresses a wake that the code rules did not already require; the prelude (`jev-wake-prelude.mjs`) still wakes on every code-decidable condition and on the always-wake list (ADR 0015 Amendment 2).
- **Sent to TypeSafe:** the ticket header (title and status line) and the new comment, each at most 4,000 characters, only for a comment from a known cell type with no verdict and no scope text. `_requests` rows and handoffs are never sent. **Touches:** the orchestrator's session-start prelude.
- **Measure:** not tokens (the prelude runs inside a session that already started, and suppressed wakes save no plan tokens that `usage.jsonl` sees). The measure is the count of suppressed wakes and the count of missed wakes. Bounce rate and tokens are checked only as the shared guard.
- **Baseline:** none for tokens. The shared bounce guard uses the last 10 tickets as above.
- **Kill condition:** one missed wake: an `informational` input after which the board shows the orchestrator later acted on it (a claim, comment or resolution traceable to it). If the trial ends with fewer than 5 suppressions, it has shown nothing and the verdict is the user's (ADR 0015 Amendment 2, C1).
- **Confidence floor:** `informational` at 0.9, `needs-claude` at any confidence. Reason: `informational` is the only label that removes a wake, so it gets a stricter floor, and `needs-claude` is the fallback anyway. There are no `wake` rows yet, so 0.9 is a prior, not a measured value.

### priority (live as a displayed suggestion)

- **Start date:** the go-live `config` row. **Mode:** live, display only. At the frontier proposal the orchestrator shows Jev's `mismatch` flag beside the ticket when one exists; code keeps the order and an explicit Priority line wins.
- **Sent to TypeSafe:** the ticket markdown, and only for a ticket with an explicit Priority line. **Touches:** the text of the frontier proposal. It changes no order and no dispatch.
- **Measure:** the user's verdict on each flag (`priority-verdict` rows), read as the share the user judged right. No token measure: nothing is applied.
- **Baseline:** none; there are no flags to compare with. The reference is ADR 0015 decision 4's earlier bar of 70% right over 10 flags, shown as information.
- **Kill condition:** none automatic (it applies nothing). The user may kill it at the verdict.
- **Confidence floor:** 0.8 (default). There are no `priority` rows yet, so there is no data for another value.

### scope (live as a displayed suggestion)

- **Start date:** the go-live `config` row. **Mode:** live, display only. The label (`small | medium | large`) is shown beside the ticket and feeds the combined order that code computes, which never crosses a P-level.
- **Sent to TypeSafe:** the ticket markdown. **Touches:** the frontier proposal; the combined order is code.
- **Measure:** same-tercile agreement between the label and the ticket's weighted tokens (terciles recomputed each report, tickets without tokens excluded, as in ADR 0015 decision 4). No token measure.
- **Baseline:** none. The reference is decision 4's earlier bar (60% same-tercile over 20 tickets), shown as information.
- **Kill condition:** a `small` pick on a ticket that turned out in the top tercile (ADR 0015 decision 4's safety rule).
- **Confidence floor:** 0.8 (default). No `scope` rows exist yet.

## Not live yet

### tier (retune first, then shadow, then trial)

- **Start date:** none. **Mode:** shadow after the retune, then live under the trial.
- **What changes:** ADR 0010 Amendment 1 (labels `small | standard | hard | other`, mapping to haiku, sonnet, opus, re-derived from the shadow rows). Separate ticket, after the first go-live.
- **Sent to TypeSafe:** the ticket markdown. **Touches:** the developer dispatch model.
- **Measure:** the shared measure over developer-class tickets, on the developer cells' weighted tokens and the ticket's bounces.
- **Baseline:** the last 10 developer-class resolved tickets before the tier go-live.
- **Kill condition:** a Haiku developer that bounces turns lowering off (raising stays on trial); a trial median above baseline or more bounces kills the use case.
- **Confidence floor:** provisional until the retune derives them: lowering to haiku at 0.9, raising to opus at 0.8. Reason: lowering is the risky direction and the user made a Haiku bounce a safety miss. Of the 59 shadow `tier` picks, 35 were `hard` (24 at 0.8 or more) and 23 `standard` (10 at 0.8 or more), so a 0.8 floor already discards about 40% of them.

### qa done-check (74) (next after verify's verdict)

- **Start date:** after verify's keep verdict. **Mode:** shadow, then the trial. Ticket 74 is parked and has no criteria; writing them is its own step.
- **Sent to TypeSafe (proposed, to be confirmed in 74's criteria):** the ticket markdown and the test output, the same inputs as verify, never handoff text. **Touches:** the qa verify hop (a check that every acceptance criterion maps to a passing test).
- **Measure and baseline:** the shared measure over tickets with a `qa` verify cell; the last 10 such tickets before its go-live.
- **Kill condition:** a done-check `done` on a ticket whose criteria were not met, found later at security, in review or by a bounce.
- **Confidence floor:** 0.8 (default); no data yet.

### handoff trimming (after qa done-check; blocked on security)

- **Start date:** none. **Mode:** none. **Blocked:** it sends handoff text, which ADR 0010 decision 9 and `security` review 67 deny for every point. It needs a new `security` review (user list, point 8) and an explicit extension of decision 9 before it makes any call, shadow included.
- **Sent to TypeSafe (proposed):** the previous cell's handoff, truncated. **Touches:** what the next cell reads at the start of its run.
- **Measure and baseline:** the shared measure over developer-class tickets (the saving is in the next cell's input tokens).
- **Kill condition:** a trimmed handoff that dropped a fact the next cell then needed (a bounce or an incident traced to it), judged from the handoffs.
- **Confidence floor:** 0.8 (default), with the fail-open rule that any doubt sends the untrimmed handoff.

## Parked (not tracked until someone files them)

Security second opinion (ticket 75), the partial-return check and compaction filtering (ticket 76) stay parked (user, 2026-10-04).
