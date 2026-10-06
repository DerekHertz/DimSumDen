# 150: floating-cards Meta+Enter test race

**Type:** bug

**Priority:** P1

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** CI reliability: every den-v1 merge needs green CI, and this test fails about half the time on main.

## What to build

In `floating-cards.test.mjs` (around line 326), the test fires the second deny keypress (Meta+Enter) as soon as the stub sees the first POST. `send()` in `Cards.jsx` still holds that kind in `inflight` until the page has processed the 202, so it drops the keypress. The fix belongs in the test: wait for the first send to settle (for example, for the in-flight state to clear) before firing the second key. Don't change `Cards.jsx` behaviour.

## Acceptance criteria

- [ ] The Ctrl+Enter / Meta+Enter test passes 20 runs in a row in isolation on main (qa measured 7 failures in 12 runs on 7c2eee1)
- [ ] It still fails if `Cards.jsx` stops sending the second deny (the test still guards the behaviour)

## Comments

- **orchestrator, 2026-10-06:** Found by 139 full qa verify (139-qa-verify.md). Filed with the user's yes. P1 because it turns CI red at random on product merges. A small qa-owned test fix.
