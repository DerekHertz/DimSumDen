# 137: North-star guardrails in the board and the wake check

**Type:** feature

**Priority:** P2

**Blocked by:** den-v1/05-transcript-f, den-v1/06-approve-deny, den-v1/07-message-t (run after the den-v1 loop works; user, 2026-10-05)

**Status:** ready-for-agent

**Serves:** ADR 0019 decision 8 (drift guardrails): keeps tokens on the active milestone instead of pipeline self-work.

## Why

On 2026-10-05, 8 of the 19 open tickets had no `Serves` line, and 9 were P1, including Blender removal and renames that ranked level with den-v1. Nothing enforced the refocus guardrails. The orchestrator's handoff 36 put den-v1 fourth on the frontier, behind three pipeline items. Priority is set once at publish and says "urgent", not "urgent for what".

## What to build

1. **`Serves` required:** `board` refuses to publish, unpark or claim a ticket with no `**Serves:**` line (or an empty one). `board audit` lists open tickets that are missing it.
2. **Active milestone:** a single board-level setting names the active feature (e.g. `den-v1`). The frontier (and `batch-groups`, and the wake prelude's frontier count) orders the active feature's tickets and the tickets they are blocked by first. It hides tickets outside the active feature unless they are P0. Priority only orders within that.
3. **Drift alarm:** the wake prelude and `pipeline-retro` report the share of the last N resolved tickets' tokens (from `usage.jsonl` cell rows) spent outside the active feature, and warn above 30%.
4. **Pipeline evidence:** a ticket whose `Serves` line names no milestone step must cite at least three `incident` rows (by ts) in the ticket. Otherwise `board` refuses to publish it.

The genome wording that points at these checks is a gated `.claude/` edit: the developer writes it as a patch in its handoff.

## Acceptance criteria

- [ ] Publishing, unparking or claiming a ticket without `Serves` is refused with a reason (test)
- [ ] With the active feature set, the frontier lists its tickets and their blockers first and hides others below P0 (test)
- [ ] The wake prelude prints the off-milestone token share and warns above 30% (test with fixture rows)
- [ ] A pipeline ticket citing fewer than three incidents is refused at publish (test)

## Comments

- **orchestrator, 2026-10-05:** Filed on the user's ask after the drift review (user, 2026-10-05). Same day: parked 113, 116, 88, 99 and 121 (no `Serves` line), and added `Serves` to 105, 106 and 107.
