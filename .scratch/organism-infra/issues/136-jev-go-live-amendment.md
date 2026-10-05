# 136: Jev go-live amendment to ADRs 0010 and 0015, plus the use-case ledger

**Type:** design-question

**Priority:** P1

**Blocked by:** None

**Status:** claimed

**Serves:** ADR 0019 decision 5 (Jev routes each step and is judged by outcomes). The user settled the go-live terms in a grilling on 2026-10-04 and confirmed the list ("yes to the jev list"). Nothing is live yet; this amendment comes first.

## What to build

Amend ADR 0010 (`docs/adr/0010-jev-precheck-tier-and-verify-depth.md`) and ADR 0015 (`docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md`) so they record the go-live terms below, and write the ledger `docs/jev-usecases.md`. Read ADR 0019 decision 5 first: it already amends 0010 decision 10 and 0015 decisions 4-5, so say where this amendment follows it and surface any conflict.

The user's confirmed list (copied from orchestrator handoff 33, `.scratch/_handoffs/2026-10-04-orchestrator-33.md`; points 1 to 9 are this ticket's scope):

1. Live now: `verify`, `route` (new-ticket half), `wake`. `priority` and `scope` live as a displayed suggestion.
2. `tier` is retuned before it goes live: may lower a small ticket to Haiku as well as raise; `hard` rubric tightened; labels and thresholds re-derived objectively from measured outcomes in the shadow rows (tokens, bounces), which the user asked for explicitly. A Haiku developer that bounces is a safety miss and turns lowering off.
3. ADR 0015 authority rules stay (allowed options only, never skip, never bypass a gate; the user approves every ticket). Only "shadow first, then exit review" is replaced.
4. Trial: 10 resolved tickets per use case, then one keep-or-kill verdict. One safety miss turns the use case off.
5. Tracking: `docs/jev-usecases.md` (start date, mode, what is sent to TypeSafe, what it touches, measure, baseline, kill condition); a `config` row per go-live; `jev-report.mjs` per use case.
6. Measure: weighted tokens per resolved ticket against the last 10 tickets before go-live, bounce rate no worse.
7. Confidence: live picks below 0.8 fall back; architect may adjust per point.
8. One `security` review before any use that sends handoff text (bounce routing, handoff trimming).
9. New use cases: qa done-check (74) first, then handoff trimming; security second opinion (75), partial-return check and compaction filtering stay parked.

For context only, not this ticket's work:

10. Close 68 (its numbers become the baseline); keep 124.
11. Queue: `architect` (ADR 0010/0015 amendment plus the ledger) right after 134, then a go-live ticket, then 99.

Also write the scope of the follow-up go-live ticket into this ticket's answer, so the orchestrator can file it. It must include this known bug: `jev.mjs verify` in shadow with fallback `no-key` printed `effective: full` on a qa-specified ticket, though shadow is meant to equal today's rule (incident logged in `.scratch/usage.jsonl`).

Files: `docs/adr/0010-*.md`, `docs/adr/0015-*.md`, `docs/jev-usecases.md` (new). No code. Any edit this needs in `.claude/` or `CLAUDE.md` (the orchestrator role file names the shadow rules) is user-gated: write the exact edit into the handoff and do not apply it.

## Acceptance criteria

- [ ] ADR 0010 and ADR 0015 each carry a dated amendment covering the points of the list that touch them, with every replaced decision named by number
- [ ] `docs/jev-usecases.md` exists with one entry per use case in points 1, 2 and 9, each with the fields of point 5
- [ ] The baseline in point 6 is defined well enough to compute from `.scratch/usage.jsonl` (which rows, which tickets, which weighting)
- [ ] Each point's confidence floor (point 7) is stated, with a reason wherever it differs from 0.8
- [ ] Conflicts with ADR 0019 decision 5 or any other ADR are surfaced, not resolved silently
- [ ] The go-live ticket's scope is written in this ticket's answer, including the `jev verify` shadow fallback fix
- [ ] Gated `.claude/` or `CLAUDE.md` edits are in the handoff as one apply command, not applied

## Comments

- **Created (orchestrator, 2026-10-05):** Filed and dispatched on the user's yes ("yes start dispatching"). The list was confirmed by the user on 2026-10-04.
