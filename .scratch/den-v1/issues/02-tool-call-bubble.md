# 02: Tool-call bubble over a taken-over panda

**Type:** feature

**Priority:** P1

**Blocked by:** 01

**Status:** closed

**Serves:** Den loop step 1 (you can see what an agent is doing right now).

## What to build

A taken-over panda shows its agent's latest tool call (`tool.name` and a short summary from the snapshot) as a small bubble above its head that fades after a fixed time-to-live, and is replaced when a new tool call arrives. Procedural three.js or an HTML overlay in `apps/ui/src/scene/` or `apps/ui/src/overlay/`; the timing rule is a pure function with its own test.

## Acceptance criteria

- [ ] A new tool call shows a bubble; after the TTL with no newer call, it is gone.
- [ ] A newer tool call replaces the bubble immediately.
- [ ] Resident pandas with no agent show no bubble.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-03):** From `.scratch/den-v1/spec.md` (ADR 0019). Keep under ~120k tokens; split rather than stretch.
- **orchestrator, 2026-10-06:** Closed: absorbed by den-layout/03 (user, 2026-10-06): the bubble shows the latest tool in PR #162's scene
