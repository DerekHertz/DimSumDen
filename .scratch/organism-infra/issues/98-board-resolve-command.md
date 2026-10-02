# 98: `board resolve` command: claim, orchestrator handoff and release in one step

**Type:** feature

**Priority:** P0

**Blocked by:** None

**Status:** ready-for-agent

## What to build

Resolving a merged ticket takes three board commands in a fixed order: `board claim <ref> orchestrator`, `board handoff <ref> --from <file>` with a State block, then `board release <ref> --status resolved --pr <n>`. The orchestrator has got that sequence wrong twice since the last retro (once without `--from`, once with a `--cell` flag and the claim missing), and each time the release refused. Add `board resolve <ref> --pr <n> [--note "<text>"]`. It takes the claim as orchestrator, writes and publishes a minimal orchestrator handoff whose State block has `current_step: resolved` and the PR in `artifacts`, then releases with `--status resolved --pr <n>`. Same refusals as today: a lock held by another cell, or a missing PR number, stops it before anything is written. It accepts several refs for a batch resolve that shares one PR.

Files: `apps/organism-infra/` (board CLI and its tests), `docs/agents/issue-tracker.md`.

## Acceptance criteria

- [ ] `board resolve <ref> --pr N` on an in-review ticket with no lock leaves it resolved, with a published orchestrator handoff and the `resolved` row written exactly as `release --status resolved --pr N` writes it (test)
- [ ] With the ticket locked by another cell, or without `--pr`, it exits non-zero and changes nothing (test)
- [ ] Several refs with one `--pr` resolve every ticket in the batch; a refusal on any ref changes none of them (test)
- [ ] `docs/agents/issue-tracker.md` documents the command; the existing claim/handoff/release path still works

## Comments
- **orchestrator, 2026-10-02:** Filed by pipeline-retro (board-claim/board-handoff incidents, 2 in the window). User yes 2026-10-02.
- **orchestrator, 2026-10-02:** Hit again resolving 04 and 96 (State block not JSON, pending not {item,owner}, handoff filename must start with NN-); 04 sat at `claimed` unnoticed for ~1h. `board resolve` should also refuse silently partial runs.

- **orchestrator, 2026-10-01:** Raised to P0 for 10-02 (user): lands before crew-dashboard/02.
