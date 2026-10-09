# 143 qa verify (light): QA pass, with two test fixes at 17daee6

Both developer claims held. I fixed the tests and committed on a detached HEAD at **17daee6**, on top of the developer's 578c82e. The orchestrator should fast-forward feat/143-steering-adapter-process to 17daee6.

## The two claims

- (a) claude-runtime-host.test.mjs:91 expected 200 from POST /agents/:id/stop. ADR 0016 line 111 says 202, and host.mjs line 274 returns 202. Claim confirmed: the test was wrong. Changed the assertion to 202.
- (b) claude-process.test.mjs:207 races the grandchild. The stub wrote the pid file right after spawn, before the `node -e` grandchild installed its SIGTERM handler. Claim confirmed. Fix in claude-stub.mjs: the grandchild now writes its own pid file after installing the handler, so waiting for the pid file means it is ready. No test assertion changed. This also makes the ignoreTerm grandchild in the host stop test reliable.

## Light verify

1. Suite: the developer's saved run (/tmp/143-tests.txt) was 3069 of 3071 pass, 0 skipped, with exactly the two failures above. After the fixes I reran only the four 143 files (host-shutdown-bounded, claude-process, claude-runtime-host, claude-runtime-shutdown): 27 of 27 pass, 0 skipped. claude-process also passed alone a second time, 16 of 16. I did not rerun the full suite, per the dispatch.
2. Diff of test files from specify sha 91ec59e to HEAD: the only test change is 200 to 202 (a correction to match the ADR, with a message added), plus the stub change above. No assertion removed or loosened.
3. Criterion map:
   - Stub dispatch, stream, held permission request, answer, kill through the real-pipe wrapper: claude-runtime-host.test.mjs ("startBridge over the real Claude runtime" dispatch and approval test; stop test) and claude-process.test.mjs.
   - No grandchild survives a kill: claude-process.test.mjs "stopping the child reaches its whole process group", the stop test in claude-runtime-host, and claude-runtime-shutdown.test.mjs (SIGTERM, SIGINT, SIGHUP, uncaught, process.exit).
   - capabilities reflects S8 outcome (approve true, send false): claude-runtime-host.test.mjs lines 61-62.
   - Bounded shutdown wait with killAllSync fallback: host-shutdown-bounded.test.mjs.
   - Nothing is human-verified at the test level; the user's manual conformance check runs after merge (per developer handoff).
4. Files touched outside ticket scope: none. The diff from specify touches claude-runtime.mjs, host.mjs, policy.mjs and server.mjs, all named in the specify handoff, plus the two test files above.

## Known flake

The developer saw a smoke:ui test fail once and pass on rerun. It is not part of 143.

## State

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "qa",
  "mode": "verify",
  "current_step": "light verify done: QA pass; two defective qa tests fixed at 17daee6 (detached HEAD)",
  "artifacts": [
    "apps/bridge/cells/claude-runtime-host.test.mjs",
    "apps/bridge/cells/claude-stub.mjs"
  ],
  "decisions": [
    "Confirmed both developer claims; fixed the tests and the stub, not the product code",
    "Reran only the four 143 test files, not the full suite, per the dispatch"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Fast-forward feat/143-steering-adapter-process to 17daee6, run npm run risk-check, then security if it hits",
      "owner": "orchestrator"
    }
  ]
}
```
