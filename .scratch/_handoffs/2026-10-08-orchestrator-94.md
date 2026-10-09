# Orchestrator handoff 94 (2026-10-08)

## State
- **organism-infra/211 resolved** (PR #209, merge 66be5cf): `scripts/spend-log.mjs`, `scripts/spend.mjs` (`npm run spend`), `scripts/spend-lib.mjs`, `log-cell --transcript`, plus the orchestrator genome line (gated patch applied by the user). Relay: qa specify (21 tests), developer (Sonnet), qa light verify (Haiku, pass), risk-check 10 hits, full security pass with 3 low notes in 211-security.md (unlocked read-then-append delta, `--transcript` follows symlinks, free-text `--session`). Follow-up only if the user wants them closed.
- **From now on:** run `spend-log` at each usage check and at handoff, and pass `--transcript <session>/subagents/agent-<id>.jsonl` to `log-cell` (see the genome). The scripts don't find transcript paths themselves.
- Advisory outcome logged (qa-specify / Jev other / qa-specify, no bounce). Worktrees GC'd; only the main checkout remains.
- **Dashboard spec written** by the product session in the user's terminal: `.scratch/kanban/spec.md` ("Kanban and Metrics (Den panel)"), product handoff `.scratch/_handoffs/2026-10-08-product.md`. It extends the existing `apps/ui/src/panel/Dashboard.jsx` and `GET /metrics`. I have not read it beyond its headings.
- **`CONTEXT.md` has uncommitted edits from the product session** (+10/-2). That's outside `.scratch/`, so it can't go in a board push: ship it as a small docs PR, or bundle it with the first kanban ticket. Ask the user.
- **Retro** (row logged): new ticket **215** (qa sessions lose the Grep tool, P3; five incidents since 2026-10-02).
- Gated-patch workaround is still needed until 214 lands (see handoff 93).

## Next (fresh session)
1. **Kanban spec:** read `.scratch/kanban/spec.md`; designer `spec` runs interactively in the user's terminal (print its `dispatch-prompt.mjs` output; never use the Agent tool), then /to-tickets with the user's approval of the breakdown.
2. Then den-v1/09 → 106 → 107 → den-v1/10 → den-v1/11; batch 213 + 214 when convenient; 215 is a P3.
3. Weekly usage 86%: warn before expensive cells.
