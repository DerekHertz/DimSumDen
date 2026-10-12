# 08: Day-one gate run

**Type:** user step (no code)

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** 03, 04, 05, 07

**Status:** ready-for-agent

**Serves:** `.scratch/queue/spec.md` decisions 13, 11, 15; ADR 0015 Amendment 3.

## What to build

The Queue goes live. The orchestrator runs this with the user in one session; it changes board data only. Source: `.scratch/queue/handoffs/01-architect.md` (Q7).

1. Run `board gate` as a dry run over every ready ticket and show the user the failures.
2. Show the proposed Class backfill. The rule is approved (user, 2026-10-12): pipeline for organism-infra, ci-cd, pipeline-telemetry and mods-trial; product for the rest. Write nothing until the user approves the list.
3. For each ready ticket with a free-text Serves line, the user rewrites it to the machine form or admits the ticket with `queue-admin admit`.
4. On the user's yes, run `board gate --apply`.
5. The user sets the active feature with `queue-admin active den-v1` (user ruling, 2026-10-12).

## Acceptance criteria

- [ ] The user saw the dry-run failures and the backfill list before anything was written.
- [ ] Every ticket has a Class line.
- [ ] Every ready ticket passes the gate, is admitted by the user, or is parked with a reason.
- [ ] A `queue_active` row names den-v1, written by the user.
- [ ] `board queue` prints the live Queue and the orchestrator proposes its top ticket.

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q7) on the user's approval. agent-os/03 resumes after this ticket (spec decision 15).
- **orchestrator, 2026-10-12:** steps 1 and 2 done: Class backfill written on the user's approval (221 pipeline, 128 product; organism-infra 107, 152, 153, 154, 196 classed product as exceptions), commit 33fdd08. Paused at step 3 by the user ("not urgent, finish the main product"): 21 tickets still fail the dry run; `gate --apply` and the active feature wait until the user resumes.
