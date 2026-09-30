# Spec: Jev decision points beyond tier and verify

**Status:** ready-for-agent (umbrella; the orchestrator tickets it after user approval)
**Author:** product, 2026-09-30. All decisions below were settled and confirmed by the user in a grilling session.
**Related:** ADR 0010 (Jev precheck: tier and verify depth), ADR 0014 (jevgrep trial), `scripts/jev.mjs`, `scripts/jev-report.mjs`.

## Problem Statement

Jev (`scripts/jev.mjs`) advises on two decision points today, tier and verify depth, both in shadow. The orchestrator still spends Opus judgment, and the user still spends attention, on decisions that are cheap to label: who takes a new ticket, who a bounce goes to, which frontier ticket goes first, and whether a new input should wake the orchestrator at all. ADR 0010 decision 1 lists these as "not Jev's". Shadow data for the first two points is in: tier (24 tickets, 3 fallbacks, +11.7% projected tokens, so it costs more) and verify (20 tickets, 0 fallbacks, -5.5% tokens, so it saves; median about 450 ms). The mixed result means each point must earn live status on its own data.

## Solution

Add Jev decision points one at a time as tracer bullets: route (with triage and bounce labels), priority and scope ranking, and a wake-up gate. Later blocked tickets add find, a qa done-check, a security escalate-only second opinion, and compaction filtering. Every point ships shadow-first and goes live only after its own exit review. Slice 1 is the exit review of tier and verify against ADR 0010. New points may run in shadow now without waiting for it.

## Authority rules (apply to every point)

1. Jev picks only among options the state machine already allows.
2. Jev may raise, never skip: it can escalate to `security` or to full verify, never away from them.
3. Jev never bypasses a gate: user verdicts, the twice-failed stop, the 80% usage stop, the two-cell file-overlap rule.
4. Every point ships shadow-first and goes live only after its exit review.
5. Routing goes live only for closed label sets with an `other` label; `other` means the orchestrator decides.
6. Where code can decide, code decides. Jev judges only what code cannot.

## Goals / Non-goals

**Goals:** cut orchestrator and user attention on cheap-to-label decisions; keep every point measurable against logged ground truth; stay inside one shared daily budget.

**Non-goals:** Jev never merges, opens PRs, edits the board, or replaces a gate. No daemon, timers or routines in v1. No diffs or transcripts sent to Jev. No auto-filling of missing Priority lines in v1. No change to tier or verify decisions in ADR 0010.

## Per-point behavior and go-live bars

### Route (slice 2)
- New-ticket labels: `product | architect | designer | qa-specify | developer-direct | user | other`.
- Bounce labels: `developer | qa | architect | user | other`.
- Never fires where the state machine dictates the next cell (for example in-review goes to qa verify).
- Ground truth: the orchestrator's actual dispatch, logged next to Jev's label.
- Live only for the closed label sets; `other` sends the decision to the orchestrator. Go-live bar is set in the slice 2 exit review from its shadow data (see Open questions).

### Priority (slice 3)
- Uses the existing manual `**Priority:** P0-P3` line (no line means P2). Frontier order stays priority, age, number, with the aging bump after 3 orchestrator sessions. An explicit Priority line always wins; aging stays in code.
- Jev flags mismatches first (for example a ticket that looks P0 but is marked P3). Filling a missing Priority line comes later.
- Flagging goes live at at least 70% user-verdict-right over at least 10 flags. Fills go live only after at least 20 fills with at least 80% "user would accept".

### Scope ranking (slice 3)
- Labels: `small | medium | large | other` (`other` means the orchestrator decides).
- Combined in code: P-level first, then unblock count (from Blocked-by edges), then smaller scope first, then age. Scope only breaks ties inside one P-level and never crosses levels.
- Advisory in shadow: log the order it would have used beside the actual order.
- Ground truth: terciles of weighted tokens per ticket from `.scratch/usage.jsonl` (`jev-report.mjs` computes baselines), recomputed each report; tickets with a 0 baseline are excluded.
- Go live at at least 60% same-tercile over at least 20 tickets, and no `small` pick was a `large` ticket in the last 10.

### Wake-up gate (slice 4)
- Code decides everything it can: frontier non-empty, usage under 80%, CI red or merge conflict, open user-verdict gate.
- Jev judges only ambiguous new inputs (a new file in `.scratch/_requests`, a ticket comment) with labels `needs-claude | informational | other` (`other` means wake).
- v1 runs as an orchestrator session-start prelude script, not a daemon. Timers and routines come after shadow.

### Later blocked tickets
- **find:** `jev.mjs find --file <path> --ask "<need>"`. Code chunks the file with IDs; Jev picks chunks (Choice at most 255 options, about 64K tokens per call); code returns exact line ranges. Called first by scout, optional for other cells. On failure or low confidence it returns "no result" and the cell reads normally. Shadow logs Jev's pointers against what the cell then read or grepped. Unblock: slice 1 done.
- **qa done-check:** blocked until verify passes its exit review (reuses that data).
- **security escalate-only second opinion:** blocked until at least 15 risk-check-clean tickets have shadow rows and security has reviewed the label set. Escalate only, never skip.
- **compaction filtering:** blocked until find has shadow results and security has reviewed transcript exposure. Runs only in the handoff/scout step.

## Data exposure

- v1 sends tickets and handoffs only, with the existing redaction and blocked-input fallback.
- find may send file contents only from `docs/`, `.scratch/`, `CONTEXT.md`, and source under `apps/`, `scripts/`, `packages/`. It denies secret-like paths. Any chunk matching a `risk-check` secret pattern is dropped, not redacted.
- Diffs and transcripts stay out until `security` reviews them.

## Budget

- One shared $0.50 daily cap. Today it is a flat `CAP=0.5` in `scripts/jev.mjs` with no per-point floors; floors are new work (slice 2 or an earlier prep ticket, see Open questions).
- Reserved floors of $0.05 each for tier, verify and route. find is capped at $0.15 per day. Priority, scope, wake-up gate and the rest share the remainder.

## Slice list (tracer bullets) and blocking edges

Order: S1, then S2, S3, S4. Blocking edges as text:

- **S1** Tier and verify exit review (ADR 0010). Blocked by: none.
- **S2** Route shadow with triage and bounce labels, plus per-point budget floors. Blocked by: none for shadow (may start now); its go-live is gated by its own exit review.
- **S3** Priority flagging and scope ranking, shadow. Blocked by: none for shadow; order after S2 for shared-file reasons (`jev.mjs`), so it does not overlap S2 files.
- **S4** Wake-up gate prelude, shadow. Blocked by: none for shadow; order after S3.
- **S5** find. Blocked by: S1.
- **S6** qa done-check. Blocked by: S1 (verify passes its exit review).
- **S7** security escalate-only second opinion. Blocked by: at least 15 risk-check-clean tickets with shadow rows, and a security review of the label set.
- **S8** compaction filtering. Blocked by: S5 shadow results, and a security review of transcript exposure.
- ADR 0012 (below) precedes S2 going live, and should land before S2 is ticketed.

## Acceptance criteria per slice

**S1 exit review**
- [ ] Orchestrator judges the 2 bounces per point from the handoffs and records tier and verify verdicts (live, stay shadow, or drop) with the current numbers as the baseline (tier: 24 tickets, 3 fallbacks, +11.7% tokens; verify: 20 tickets, 0 fallbacks, -5.5% tokens, median about 450 ms).
- [ ] `jev-report.mjs` output supports the verdict without hand computation.
- [ ] The verdict is recorded on the board; any live switch needs the user's yes.

**S2 route shadow**
- [ ] `jev.mjs` accepts a route request for new tickets and for bounces, with exactly the label sets above; any other model output maps to `other`.
- [ ] Route never fires where the state machine dictates the next cell (tested).
- [ ] Each call logs label and the orchestrator's actual dispatch to `usage.jsonl`; `jev-report.mjs` reports agreement per label.
- [ ] Per-point daily floors ($0.05 each for tier, verify, route) inside the shared $0.50 cap; a point over its floor draws only from the shared remainder (tested). Failure or blocked input falls back to "orchestrator decides".
- [ ] Nothing routes live; no gate is touched.

**S3 priority and scope shadow**
- [ ] Priority: a mismatch flag is emitted only where an explicit line exists and the content disagrees; the explicit line still orders the frontier (tested). No line fills in v1.
- [ ] Scope: labels as above; combined order computed in code (P-level, unblock count, scope, age); never crosses a P-level (tested); actual order logged beside the would-have-used order.
- [ ] `jev-report.mjs` computes terciles of weighted tokens, recomputed each run, excluding 0-baseline tickets, and reports flag verdict rate, same-tercile rate, and small-vs-large misses in the last 10.
- [ ] Go-live bars above are encoded in the report as pass/fail lines.

**S4 wake-up gate**
- [ ] A session-start prelude script decides every code-decidable condition without calling Jev.
- [ ] Only ambiguous new inputs call Jev; labels `needs-claude | informational | other`; `other` and any failure wake the orchestrator.
- [ ] Shadow logs the label and whether the orchestrator then acted; no daemon, no timer.

**S5 find** (when unblocked)
- [ ] `jev.mjs find --file <path> --ask "<need>"` returns exact line ranges chosen by code from Jev-selected chunk IDs; at most 255 options and about 64K tokens per call.
- [ ] Denied paths and secret-pattern chunks are never sent (dropped, tested); capped at $0.15 per day.
- [ ] Low confidence or failure returns "no result".
- [ ] Shadow logs pointers versus what the cell read or grepped.

**S6 to S8** are ticketed only when their blockers clear; each carries its own criteria then, and each ships shadow-first.

## Testing decisions
- Test external behavior through `jev.mjs` and `jev-report.mjs` with a fake model call, as the existing tier and verify tests do (`node --test`). Highest seam: the point's public function with an injected model adapter and a temp `usage.jsonl`.
- Deterministic parts (ordering, floors, path denial, secret drop, gate conditions) get plain unit tests; labels from the model get only "outside the set becomes `other`" tests.

## Out of scope
Auto-filling Priority, daemons and timers, diffs and transcripts to Jev, per-point live switches without an exit review, changes to ADR 0010 tier and verify decisions, any Claude API use (ADR 0001).

## Open questions (genuine)
1. **ADR numbering.** The brief says architect writes "ADR 0012", but `docs/adr/0012-organ-renamed-station-brain-gate-renamed-pass-gate.md` already exists, and 0013 and 0014 are taken too. The next free number is 0015. Architect should use 0015 unless the user says otherwise. The ADR supersedes only the "not Jev's" list in ADR 0010 decision 1.
2. **Overlap with ADR 0014 (jevgrep).** 0014 treats codebase context supply at dispatch as its own capability outside Jev's decision points, with spend on the user's provider account outside the $0.50 cap. `find` is a separate in-repo Jev call inside the cap. The architect's ADR should state how find relates to `jg` (complement or replace) and settle it after the 0014 trial verdict.
3. **Route go-live bar.** The brief gives numeric bars for priority and scope but not for route. Slice 2's exit review must propose one (for example an agreement rate over a minimum ticket count) before it goes live; the user approves it.
4. **Where the per-point floors land.** They are new work in `jev.mjs`; ticketing decides whether they ride with S2 or ship as a prep ticket ahead of it.

## Further notes
- The qa-specify floor for verify already exists (ticket 58); `jev-report.mjs` exists and is extended, not rebuilt.
- Vocabulary follows `CONTEXT.md`: cell, station, board, frontier, pass gate, relay.
