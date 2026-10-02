# 101: Usage meter shows wind-down at 90% (5-hour window)

**Type:** feature

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

## What to build

The 5-hour wind-down moved from 80% to 90% (user decision 2026-10-01; code side in organism-infra/91 for `scripts/`). The UI's usage meter still uses the old threshold: `apps/ui/src/panel/usage-meter-model.mjs` line 8 sets `level` to `"wind-down"` at `v >= 80`. Change it to 90, keeping `at-limit` at 95, and update `usage-meter-model.test.mjs` boundaries (79/80 become 89/90). Check the meter's status text and any CSS or spec reference for the same 80% number. The weekly window is unaffected.

Files: `apps/ui/src/panel/usage-meter-model.mjs`, `apps/ui/src/panel/usage-meter-model.test.mjs`.

## Acceptance criteria

- [ ] At 89% the meter level is `ok`; at 90% it is `wind-down`; at 95% it is `at-limit` (test)
- [ ] No 80% 5-hour wind-down reference remains in `apps/ui/src/panel/`
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Found by qa specify for batch K (91 covers `scripts/` only). Filed on the user's yes. Small; good batch partner for the next UI or infra relay.
