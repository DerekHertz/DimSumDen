# 180: `den-scene-mounted` test forces the TAP reporter

**Type:** bug

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Environment issue from batch D qa specify, 2026-10-07. `apps/ui/den-scene-mounted.test.mjs` parses TAP output (`# fail 0`) from a child test run. CI runs Node 22, where that output is TAP, so it passes. On the MacBook's Node 24 the child prints the spec reporter, so the test fails on every local `npm test`.

## What to build

Have the test's child `node --test` run pass `--test-reporter=tap` explicitly, so the output it parses does not depend on the Node version or on TTY detection. Check other tests that parse `# fail`/`# pass` from a child run and do the same there.

Files: `apps/ui/den-scene-mounted.test.mjs` (and any test with the same pattern).

## Acceptance criteria

- [ ] `apps/ui/den-scene-mounted.test.mjs` passes on Node 24 and on Node 22
- [ ] No test that parses child TAP output relies on the default reporter (grep check in the handoff)

## Comments

- **orchestrator, 2026-10-07:** Filed from batch D's environment issue (user chose this fix, 2026-10-07). Until it lands, verify treats this one failure as known and unrelated.
