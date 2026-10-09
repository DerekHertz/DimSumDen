# 143 developer 2: implementation green except two tests that look wrong

Branch feat/143-steering-adapter-process, head 578c82e (no new code this round; the first draft worked as written). Of qa's 27 tests across the four 143 files, 25 pass. The full npm test run was 3068 of 3071, with those 2 failures plus a smoke:ui test that passed on rerun (flaky, not 143).

## The two failures (qa tests, not edited)

1. claude-runtime-host.test.mjs line 91 expects POST /agents/:id/stop to answer 200. ADR 0016 (status table) and the existing host-core.test.mjs line 224 say 202; host.mjs has always returned 202. The fix is in the test.
2. claude-process.test.mjs line 207 ("SIGKILL ends a child that ignores SIGTERM, and a grandchild that ignores it too") sends SIGTERM as soon as the grandchild pid file appears. The stub writes the file right after spawning `node -e`, before that process has installed its SIGTERM handler, so the group SIGTERM kills it. It fails 3 of 3 runs; with a 500 ms wait before the signal it passes. The fix is a wait (or a ready signal from the grandchild) in the stub or test.

I changed neither, per the rule on qa's tests.

## Review

I read the diff of host.mjs, policy.mjs and server.mjs against 91ec59e: bounded shutdown wait, policy.spawnWaitMs can only lower the constant, the production main passes createClaudeRuntime(process.env). Nothing to change. claude-runtime.mjs behaved as designed in the other 25 tests (group kill on SIGTERM and SIGKILL, group reap on exit, SIGTERM/SIGINT/SIGHUP/uncaught/process.exit cleanup, bounded shutdown).

## State

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "developer",
  "current_step": "implementation done and reviewed; 2 qa tests need a qa fix before verify",
  "artifacts": [
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/policy.mjs",
    "apps/bridge/cells/host.mjs",
    "apps/bridge/server.mjs"
  ],
  "decisions": [
    "Left qa's two defective tests untouched and flagged them in a ticket comment",
    "Released at in-review so qa can fix the tests and verify"
  ],
  "failures": [
    "claude-runtime-host.test.mjs:91 expects stop 200, ADR and host-core say 202",
    "claude-process.test.mjs:207 races the grandchild's SIGTERM handler install"
  ],
  "pending": [
    {
      "item": "Fix the two tests (stop status 202; wait for the ignoreTerm grandchild to be ready before SIGTERM), rerun the four 143 files, then verify. The user's manual conformance check runs after merge",
      "owner": "qa"
    }
  ]
}
```
