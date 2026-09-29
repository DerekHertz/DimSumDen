# 30: Handoff rejections print the expected State block

**Type:** task

**Priority:** P1

**What to build:** When `board handoff` or `board release` rejects a handoff's State block (`apps/organism-infra/board-service.mjs`, the "must name ticket" and "no valid handoff State block" errors), print a filled-in fenced json skeleton for that ticket, cell and mode, with every required field (`ticket`, `cell`, `mode` for moded cells, `current_step`, `artifacts`, `decisions`, `failures`, `pending` as `{item, owner}`), so the cell can fix it in one retry. Also make `release` refuse when no valid handoff was published after the claim (the designer's release went through without one on 2026-09-29).

**Blocked by:** None

**Status:** in-review

- [ ] Each State-block rejection prints the skeleton with the ticket, cell and mode filled in
- [ ] `release --status` to anything except `blocked` refuses when no valid handoff is newer than the claim
- [ ] Tests cover both

## Comments
- **Evidence (orchestrator, 2026-09-29):** 4 State-block rejections in one cloud session: qa missing `mode`, designer markdown instead of json (twice), developer missing four fields. See incidents in `.scratch/usage.jsonl` with tool "board handoff" / "board release".
- **Decision (user, 2026-09-29):** agreed.
