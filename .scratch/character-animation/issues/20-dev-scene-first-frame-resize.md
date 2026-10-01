# 20: dev-scene sizes its renderer on the first frame

**Type:** task

**Priority:** P3

**What to build:** `dev-scene.mjs` sizes its renderer on the first frame, not only at load and on resize, so a newly opened Browser pane doesn't render an empty canvas.

Source: split from character-animation/11 (design sweep, 2026-09-30).

**Blocked by:** none

**Status:** ready-for-agent

- [ ] Opening the dev scene in a freshly opened pane renders a non-empty canvas on the first frame.
- [ ] Load and resize sizing still work as before.

## Comments
- **Created (orchestrator, 2026-09-30):** Split from ca/11 when it was superseded by den-scene-v1/09.
