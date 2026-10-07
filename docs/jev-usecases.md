# Jev use cases: ledger

One entry per use case. Terms come from ADR 0010 Amendment 1 and ADR 0015 Amendment 2 (2026-10-07, organism-infra/136); read those for the authority rules (Jev picks only among allowed options, may raise and never skip, never bypasses a gate, the user approves every ticket). Nothing below is live until the build tickets merge and append a `config` row per use case. The start date is that row's `ts`.

## Shared rules

**Trial.** A use case runs on 10 resolved tickets on which it fired (a `jev` row at that point in the use case's mode, no fallback), then gets one keep-or-kill verdict from the user, on the `jev-report.mjs` section for that use case. If it has not reached 10 after 20 resolved tickets, the verdict is made on what exists. At most one acting use case per hop at a time, so a change in tokens has one cause: qa done-check starts only after verify's verdict, since both act on qa verify.

**Safety miss and kill.** One safety miss, defined per use case below, turns the use case off at once: the orchestrator appends a `config` row with `mode: off` and the reason, and `jev.mjs` reads it (ADR 0010 Amendment 1). Beyond that, a use case is killed at the verdict if its measure is worse than its baseline.

**Config row** (one per go-live, keep, kill and promotion; appended by a `jev.mjs` command, never by hand):

```json
{"kind":"config","ts":"...","jev_usecase":"verify","mode":"live|shadow|advisory|off","conf_floor":0.8,
 "baseline":{"tickets":["feature/NN-slug"],"median":0,"mean":0,"bounces":0},"reason":"go-live|keep|kill|safety-miss: <ref>"}
```

The baseline is computed once, at go-live, and frozen in the row, so later rows cannot move it.

**Baseline** (weighted tokens per resolved ticket against the last 10 tickets before go-live, bounce rate no worse). Computed from `.scratch/usage.jsonl`:

- *Rows.* `kind:"resolved"` (one per resolved ticket, in file order, which is chronological; `bounces` is its bounce count), joined by ticket key (`feature/NN-slug`, as `jev-report.mjs` keys it) to `kind:"cell"` rows. Lines that are not valid JSON are skipped (line 1182 of the file was corrupt, with terminal colour codes inside a `usage` row). Rows with `backfill: true` and `cell_backfill` rows are ignored.
- *Which tickets.* The last 10 `resolved` rows before the go-live `config` row that have at least one `cell` row with `tokens` above 0 and belong to the use case's class: for `verify` and `tier`, at least one `developer` cell row; for `route` and `wake`, any ticket with tokens; for qa done-check, at least one `qa` cell with a `verify` mode. The trial's tickets are chosen by the same class rule.
- *Weighting.* A ticket's weighted tokens are the sum, over its `cell` rows, of `tokens` times the weight of the row's model: haiku 0.5, sonnet 1, opus 2 (the user's weights, ADR 0010 decision 10; the build ticket checks the Haiku 5.5 price). The model is the row's `model` field with the `claude-` prefix and version dropped (`claude-sonnet-5-5` is sonnet); when the field is absent, the genome default: scout haiku, designer, debugger and orchestrator opus, every other cell sonnet. Few cell rows carry a model today, so a Haiku dispatch logged without `--model` counts as sonnet; build ticket F makes the orchestrator pass `--model` to `log-cell.mjs` on every dispatch. Jev's own cost is API credit, not plan tokens, and is reported beside the measure, not in it. The orchestrator's own tokens are not logged (ADR 0019), so a saving there is not in the measure.
- *Statistic.* The median of weighted tokens per ticket is the measure; the mean is shown beside it, since one ticket can dominate (`den-scene-v1/11` alone weighed about 2.1M of the window then).
- *Bounce rate.* The sum of `bounces` over the same 10 tickets. "No worse" is a trial total at or below the baseline total.
- *Keep needs both:* trial median weighted tokens at or below the baseline median, and trial bounces at or below the baseline bounces. Where a use case cannot move tokens (wake, priority, scope, route's orchestrator saving), its entry says so and names its own measure.

**Confidence floor.** A live pick below its floor falls back to the orchestrator's own rule and the orchestrator shows both. The default is 0.8; every other floor has a reason in its entry. A raising pick (more verification, a stronger model) needs no floor where noted, since falling back to today's rule is never safer than applying it.

## Use cases

### route, new-ticket half (live after preparation, then trial)

- **Start date:** the go-live `config` row, written only after the replay bar below. **Mode:** live. The orchestrator proposes Jev's pick as the first-cell proposal when it is not `other` and has confidence at or above the floor; below it, the orchestrator decides and shows both. The user approves every dispatch. The bounce half stays advisory.
- **Before go-live (build ticket A):** normalize advisory-outcome aliases (`qa` to `qa-specify`, `developer` to `developer-direct`; true agreement is 27 of 39 labelled tickets, 69%); add `security` to the labels; prepend a code-built header to `state` (ticket Type, files touched, gated-path flags, relay defaults; jev-1.13 has a 32k-token window); sharpen the criteria text; build an atomic yes/no version composed in code. Replay both versions on the 39 labelled tickets, keep the higher, and go live only at 80% agreement or more.
- **Sent to TypeSafe:** the ticket markdown and the code-built header. **Touches:** the orchestrator's first-cell proposal for a ready-for-agent ticket, and one `jev-advisory-outcome` row per dispatch (orchestrator pick, Jev pick, the user's choice, bounced).
- **Measure:** the **override rate**: dispatches where the user chose a cell other than Jev's pick, out of the trial's 10. The saving (the Opus judgment the orchestrator no longer spends) is not in `usage.jsonl`; the shared token measure is shown as a guard.
- **Baseline:** the last 10 resolved tickets with tokens; the override reference is the replay's disagreement rate.
- **Kill condition (safety miss):** a pick that would skip a required cell (for example a dispatch of Jev's `developer-direct` on a ticket that needed qa tests), or a ticket whose wrong first cell is named as the cause of a bounce. At the verdict, also 4 or more overrides in 10.
- **Confidence floor:** 0.8. Reason: confidence did not separate agreement in the advisory data, so there is no evidence to move the default. Revisit at the verdict.

### verify (live)

- **Start date:** the go-live `config` row. **Mode:** live. Jev's `full` pick raises light to full; `light` applies when Jev picks it at the floor, all tests are green and `risk-check` is clean, including on tickets qa never specified (the floor of ticket 58 is lifted, ADR 0010 Amendment 1). Light verify runs on Haiku.
- **Sent to TypeSafe:** the ticket markdown and the developer's test output (`--tests`), tail-truncated to 16k characters (ADR 0010 decision 9). **Touches:** the qa verify dispatch depth and model. Nothing else.
- **Measure:** the shared measure over developer-class tickets: median weighted tokens at or below baseline, bounces no worse. Verify can now save tokens, so savings count.
- **Baseline:** the last 10 developer-class resolved tickets before go-live.
- **Kill condition (safety miss):** any escaped bug: a ticket where `light` was applied and a defect was later found by `security`, in review or after merge that a full verify would plausibly have caught, judged by the orchestrator from the handoffs. At the verdict, also a trial median above baseline, or more bounces.
- **Confidence floor:** 0.8 for `light`; `full` at any confidence. Caution: in the shadow history (latest pick per resolved ticket, 66 tickets) 52 picks were `light`, none reached 0.8 (highest 0.74) and 18 were on tickets with no qa `specify`. Build ticket B replays this and reports how many qa-unspecified tickets reach 0.8 before go-live; if none, the trial may fire rarely and the floor is the user's to revisit.
- **Regression test (build ticket B):** `effective` equals today's rule in every mode and every fallback reason (ticket 160 fixed the shadow baseline).

### wake (live)

- **Start date:** the go-live `config` row. **Mode:** live. An `informational` label suppresses a wake that the code rules did not already require; the prelude (`jev-wake-prelude.mjs`) still wakes on every code-decidable condition and on the always-wake list: any user-authored comment, `Scope added`, any `--verdict` comment, an unknown author, a `_requests` row (ADR 0015 Amendment 2). Live despite ADR 0019 decision 5.
- **Sent to TypeSafe:** the ticket header (title and status line) and the new comment, each at most 4,000 characters, only for a comment from a known cell type with no verdict and no scope text. `_requests` rows and handoffs are never sent. **Touches:** the orchestrator's session-start prelude.
- **Measure:** safety only. The count of missed wakes is the judge; the count of suppressed wakes is shown beside it. Suppressed wakes save no plan tokens that `usage.jsonl` sees.
- **Baseline:** none.
- **Kill condition (safety miss):** one missed wake: an `informational` input after which the board shows the orchestrator later acted on it (a claim, comment or resolution traceable to it). If the trial ends with fewer than 5 suppressions, it has shown nothing and the verdict is the user's.
- **Confidence floor:** `informational` at 0.9, `needs-claude` at any confidence. Reason: `informational` is the only label that removes a wake, and there are no `wake` rows yet, so 0.9 is a prior, not a measured value.

### priority (displayed suggestion, advisory)

- **Start date:** the go-live `config` row. **Mode:** advisory, display only, collecting data. At the frontier proposal the orchestrator shows Jev's `mismatch` flag beside the ticket when one exists. **It does not feed the order**; code keeps the order and an explicit Priority line wins.
- **Sent to TypeSafe:** the ticket markdown, only for a ticket with an explicit Priority line. **Touches:** the text of the frontier proposal. No order, no dispatch.
- **Measure:** the user's verdict on each flag (`priority-verdict` rows): share judged right. No token measure.
- **Baseline:** none. The old decision 4 bar (70% right over 10 flags) is the bar for **promotion to applied**, which is a separate decision and `config` row.
- **Kill condition:** none automatic (nothing is applied). The user may kill it at any verdict.
- **Confidence floor:** 0.8 (default). No `priority` rows exist, so there is no data for another value.

### scope (displayed suggestion, advisory)

- **Start date:** the go-live `config` row. **Mode:** advisory, display only, collecting data. The label (`small | medium | large`) is shown beside the ticket. **It does not feed the order.**
- **Sent to TypeSafe:** the ticket markdown. **Touches:** the frontier proposal text only.
- **Measure:** same-tercile agreement between the label and the ticket's weighted tokens (terciles recomputed each report, tickets without tokens excluded). No token measure.
- **Baseline:** none. The old decision 4 bar (60% same-tercile over 20 tickets, and no `small` pick in the top tercile) is the bar for promotion to applied.
- **Kill condition:** none automatic. A `small` pick on a top-tercile ticket is reported as a data-quality flag.
- **Confidence floor:** 0.8 (default). No `scope` rows exist yet.

### tier (retune, replay, then trial)

- **Start date:** the tier `config` row, after the retune and replay (build ticket E). **Mode:** live under the trial.
- **What changes:** ADR 0010 Amendment 1. Labels `small | standard | hard | other` map to haiku, sonnet, opus, re-derived from the 98 shadow rows by measured outcomes. Jev may lower a developer to Haiku 5.5 (`claude-haiku-5-5`) for a ticket rated `small` at 0.8 or more, and raise to Opus. The retune is validated by a replay on the labelled history (architect adjustment to the draft's separate 10-ticket shadow run; adjustable by the user).
- **Sent to TypeSafe:** the ticket markdown. **Touches:** the developer dispatch model (and light verify on Haiku).
- **Measure:** the shared measure over developer-class tickets, on the weighted tokens of the ticket and its bounces.
- **Baseline:** the last 10 developer-class resolved tickets before the tier go-live.
- **Kill condition (safety miss):** a Haiku developer that bounces turns **lowering** off (raising stays on trial). At the verdict, a trial median above baseline or more bounces kills the use case.
- **Confidence floor:** lowering to haiku at 0.8 (the user's rule), raising to opus at 0.8 until the retune derives otherwise. The replay may recommend a stricter lowering floor; that is reported, not applied.

### qa done-check (74) (after verify's verdict; escalate-only)

- **Start date:** after verify's keep verdict. **Mode:** live under the trial, escalate-only (it may only raise). Ticket 74 needs criteria written (build step).
- **What it does:** Jev judges the acceptance criteria from the criteria, the test output and, after ticket 42, the diff. `fail` raises (light verify to full verify, full verify back to the developer); `pass` changes nothing.
- **Sent to TypeSafe:** the ticket markdown and the test output; the diff only after `security` review 42. Never handoff text.
- **Measure and baseline:** the shared measure over tickets with a `qa` verify cell; the last 10 such tickets before its go-live.
- **Kill condition (safety miss):** a `pass` on a ticket whose criteria were not met, found later at security, in review or by a bounce. Because `pass` changes nothing, this is a missed escalation, not a lowering.
- **Confidence floor:** 0.8 for `fail`; `pass` at any confidence changes nothing.

### handoff trimming (after done-check; blocked on security review 42)

- **Start date:** none. **Mode:** none. **Blocked:** it sends handoff text, which ADR 0010 decision 9 denies. It needs `security` review 42 and a recorded extension of decision 9 before any call, shadow included. Bounce routing waits on the same review.
- **Sent to TypeSafe (proposed):** the previous cell's handoff, truncated. **Touches:** what the next cell reads at the start of its run.
- **Measure and baseline:** the shared measure over developer-class tickets (the saving is in the next cell's input tokens).
- **Kill condition (safety miss):** a trimmed handoff that dropped a fact the next cell then needed (a bounce or an incident traced to it), judged from the handoffs.
- **Confidence floor:** 0.8, with the fail-open rule that any doubt sends the untrimmed handoff.

### finding information (not a Jev call; ADR 0015 Amendment 2, ADR 0014 Amendment 1)

- **What:** the start-here context file goes to every hop that starts cold (also full qa `verify`, `security`, `scout`); `scout` calls `jg` before grepping.
- **Measure:** the shared measure over tickets with those hops, plus the `kind:"jg"` rows (bytes, skips, fallbacks). Baseline: the last 10 tickets before the change. Kill: a trial median above baseline, or a stale context file named as the cause of a bounce.

## Parked (not tracked until someone files them)

Security second opinion (ticket 75), the partial-return check and compaction filtering (ticket 76) stay parked (user, 2026-10-04).
