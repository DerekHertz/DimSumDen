# 66: board handoff --template prints a valid State block

**Type:** feature

**Priority:** P1

**What to build:** Almost every cell's first `board handoff` on 2026-09-30 failed State-block validation (missing ticket name, `pending` as strings instead of `{item, owner}`, missing required keys), about 9 wasted calls. Add `board handoff <ref> --template [--cell <c>] [--mode <m>]` that prints a State block skeleton that already passes validation (ticket filled from the ref, cell/mode from the lock when held, every required key present, one example `pending` entry). Point the `handoff` skill at it with one line.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] `--template` output, with its placeholders filled, passes the same validation `board handoff` runs (test)
- [ ] Ticket, cell and mode are pre-filled from the ref and the held lock (test)
- [ ] The handoff skill names the command (the `.claude/` edit is applied by the user)

## Comments
- **Retro (user, 2026-09-30):** approved as the code fix for the repeated State-block failures.
