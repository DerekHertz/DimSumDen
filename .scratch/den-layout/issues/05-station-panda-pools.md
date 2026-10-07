# 05: Station panda pools show capacity

**Type:** feature

**Priority:** P3

**Blocked by:** 03

**Status:** needs-design

**Serves:** The den as an honest picture of the organism's capacity: who is free, who is busy, and what is waiting.

## What to build

Instead of one panda per role plus split-off pandas for extra agents (den-layout/03), each station keeps a fixed pool of pandas sized to the real concurrency (`max_concurrent_cells`, or per-role limits if they exist). Idle pandas wait at their station; a dispatch pulls one from the pool to its ticket, and it returns when the cell ends. When a station's pool is all busy, queued work is visible as waiting.

Open questions for `product` and `designer` (direction mode) before any code: pool size per station, how queued work looks, what happens to the 4 scenery pandas, and whether split-offs go away. Needs an approved mockup before build (memory: design session before visual code).

## Acceptance criteria

- [ ] Requirements and visual direction settled (product spec + designer mockup approved by the user)
- [ ] Each station shows its pool; a live dispatch takes an idle panda from it and returns it on finish (test)
- [ ] A station with no idle panda shows the waiting work (test)
- [ ] `npm test` and `npm run smoke:ui` pass

## Comments

- **orchestrator, 2026-10-06:** Filed at the user's request (likes the idea, low priority; north star tickets first). Look at it after den-layout/04; it changes 03's split-off model.
