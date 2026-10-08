# 206: Browser test hangs when run standalone

**Type:** bug

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** environment issue from den-v1/06 developer round 2 (2026-10-08). Cells lose calls on a test they cannot run alone.

## What to build

`apps/ui/.../proximity-card.browser.test.mjs` hangs when run by itself: the page produces no frames (the card never hides while S is held) and `page.screenshot` hangs. It passes inside the full `npm test`, and failed the same way on a commit before den-v1/06's wiring. Suspected cause: headful Chromium frame throttling (background or occluded window) in the browser test launcher's `buildLaunchOptions`. Find the cause and make the test run alone as it does in the suite.

## Acceptance criteria

- [ ] `node --test` on `proximity-card.browser.test.mjs` alone passes in WSL, repeatably (3 runs).
- [ ] The fix lives in the shared launcher, so other browser tests get it too.
- [ ] `npm test` is green.

## Comments

- **Created (orchestrator, 2026-10-08):** User agreed fix for the environment issue in handoffs den-v1/06-developer-2.md. Until this lands, cells run browser tests only through `npm test`.
