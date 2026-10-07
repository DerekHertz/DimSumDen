# 136: Jev go-live amendment to ADRs 0010 and 0015, plus the use-case ledger

**Type:** design-question

**Priority:** P0

**Blocked by:** None

**Status:** ready-for-agent

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
- **architect, 2026-10-06:** architect died with no handoff (handoff 36); user parks 136 until den-v1 works
- **orchestrator, 2026-10-06:** Parked: User 2026-10-05: park until den-v1 works. The stalled architect's uncommitted partial work (ADR 0010/0015 edits, docs/jev-usecases.md) lives only in the Mac worktree agent-aa4acad29a81bddf3; the gated patch is at .scratch/_handoffs/gated/136-jev-go-live-genome.patch.
- **architect, 2026-10-06:** stale lock from the architect that died on 2026-10-05 (handoff 36), no handoff left; force-cleared on the user's yes, 2026-10-05. Ticket stays parked; partial work stays in worktree agent-aa4acad29a81bddf3
- **orchestrator, 2026-10-06:** With the user's yes, the dead architect's drafts are WIP-committed as fa3181f on local branch `docs/136-jev-go-live-amendment` (worktree agent-aa4acad2, now clean; pushed to origin with the user's yes, 2026-10-06). Resume from that commit; ADR 0015 Amendment 2 lists conflicts for the user to settle.
- **orchestrator, 2026-10-07 (un-parked, P0):** User: "we need to start actually letting jev help with making decisions and finding information for agents ... bump the priority." Grilling settled the draft's conflicts C1-C7; user confirmed "yes to 136". The architect resumes from fa3181f (`docs/136-jev-go-live-amendment`), writes these into ADR 0010/0015 and `docs/jev-usecases.md`, adds new terms to `CONTEXT.md`, and scopes the build tickets:
  1. **Route, new tickets (C2):** live. The orchestrator proposes Jev's pick at conf ≥ 0.8; below that it falls back and shows both; user approves every dispatch. Before go-live: normalize label aliases in advisory-outcome rows (`qa`=`qa-specify`, `developer`=`developer-direct`; real agreement 27/39 = 69%); add `security` to route's labels; prepend a code-built header to `state` (ticket Type, files touched, flags for gated `.claude/`/`CLAUDE.md`, `.github/workflows`, `apps/ui`/assets, relay defaults; jev-1.13 has a 32k-token window); sharpen the criteria text; also build an atomic version (yes/no questions: scope open → product, design/ADR → architect, UI/visual → designer, CI/deps/secrets → security; else qa-specify or developer-direct, composed in code; TypeSafe advises "atomic questions composed in code"). Replay both on the 39 labelled tickets; keep the higher; go live only at ≥ 80% agreement. Then a 10-ticket trial; one safety miss turns it off. TypeSafe offers no few-shot or fine-tuning.
  2. **Verify (C3):** lift the qa-unspecified floor: light verify when Jev picks `light` at conf ≥ 0.8, all tests green, risk-check clean. Any escaped bug turns it off.
  3. **Done-check (74):** escalate-only. Jev judges criteria from criteria + test output + diff; `fail` → full verify or back to developer; `pass` changes nothing. Sending the diff waits for 42.
  4. **Wake (C1):** live despite ADR 0019; code wakes on any user-authored comment; trial judged on safety only.
  5. **Priority and scope (C6):** displayed suggestions only, collecting data; not live until the data supports it.
  6. **Handoff text and diffs to TypeSafe (C4):** un-park 42 (security review) right after 136; bounce routing, handoff trimming and done-check wait on it.
  7. **Finding information:** the start-here context file goes to every hop that starts cold (full qa verify, security, scout); scout calls `jg` before grepping.
  8. **Tier (C7):** retune from the 98 shadow rows; Haiku 5.5 (`claude-haiku-5-5`, Claude Code ≥ 2.1.293) may take developer work on tickets Jev rates `small` at conf ≥ 0.8; one Haiku bounce turns lowering off. Light verify moves to Haiku with it.
  9. **Gated edits (C5):** the cell writes the exact new text for `.claude/`/`CLAUDE.md` into the ticket; the user applies it in an interactive session without auto mode. Same method unblocks 182.
