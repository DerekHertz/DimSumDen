# 24: Board claim ergonomics (comment author, reclaim, release without a status change)

**Type:** task

**What to build:** Three gaps in the board CLI that cells hit on 2026-09-28. qa left them out of 18's scope (see `.scratch/organism-infra/handoffs/18-qa-specify.md`).

1. A comment shows its author as "unknown" when no claim lock exists at comment time. Use the caller's cell name, from `--as` or the lock, and reject the comment if there's neither.
2. There's no `reclaim` subcommand. Cells taking over a stale claim released it to `ready-for-agent` and claimed it again by hand. Add an explicit `board reclaim <ref> <cell>`, or document that `claim` takes over a stale lock.
3. qa specify can't end its claim without changing the ticket status. Add `board release <ref> --keep-status`, which frees the lock and leaves the status as it is.

**Blocked by:** 18 (same CLI surface)

**Status:** ready-for-agent

- [ ] A comment without an author source is rejected, and one with `--as <cell>` records that cell
- [ ] A stale claim can be taken over in one command
- [ ] `release --keep-status` frees the lock and leaves the status unchanged

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request, as a follow-up to 18.
