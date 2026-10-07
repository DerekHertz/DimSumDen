# 127: in-review release refuses a handoff that lists failures

**Type:** fix

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** pipeline retro 2026-10-03, cause 2. Developers moved tickets to review with a failing `smoke:ui` noted as "unknown".

## What to build

The three batch D1 developer handoffs (den-v1/01, 03, 04) listed a `smoke:ui` failure (camera zoom, camera pan) in `failures`. Each was still released to `in-review`, and the failure was never diagnosed. qa then found a real regression. Change `board release <ref> --status in-review` so it refuses when the matching handoff's State block has a non-empty `failures` array, unless `--accept-failures "<reason>"` is passed. A reason passed that way goes into the `events.jsonl` release row so the reviewer sees it. Releases to other statuses, and `--keep-status`, are unchanged.

## Acceptance criteria

- [ ] `release --status in-review` refuses when the handoff's `failures` is non-empty. It names the failures and suggests `--accept-failures`, and nothing is written.
- [ ] With `--accept-failures "<reason>"` the release succeeds, and its event row carries the reason.
- [ ] An empty `failures` array releases exactly as it does today, as do releases to `resolved` and `--keep-status`.
- [ ] `docs/agents/issue-tracker.md` and the developer genome's release line mention the flag (one line each).
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** Pipeline retro. Handoffs `.scratch/den-v1/handoffs/01-developer.md`, `03-developer.md`, `04-developer.md`.
- **orchestrator, 2026-10-07:** Parked: User 2026-10-07: north star first (den v1 loop). Pipeline work waits; unpark after den-v1/07 or on a 3rd repeat incident that blocks the relay.
