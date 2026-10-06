# 143: Steering adapter, process half (106-D2): child wrapper and default runtime

**Type:** feature

**Priority:** P1

**Blocked by:** 141, 142

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4: the real runtime behind the host.

Scope source: ADR 0016 (as amended in PR #157) and the split table in `.scratch/organism-infra/handoffs/106-architect.md`. Parent: 106.

## What to build

Child wrapper over real pipes (a stub script speaks the stream), kill and process-group handling per S4b, shutdown wiring, the default runtime, `DEN_CLAUDE_BIN`, and `capabilities` set from the S8 and S3 outcomes (approval inbox off if S8 is outcome (d)). The user runs a manual conformance check after merge.

## Acceptance criteria

- [ ] A stub-script test dispatches, streams, holds and answers a permission request, and kills through the real-pipe wrapper.
- [ ] No grandchild survives a kill (per the S4b verdict).
- [ ] `capabilities` reflects the S8 outcome; with (d) the inbox is off.

## Comments
