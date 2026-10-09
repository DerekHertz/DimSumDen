# 143 developer: implementation written, tests NOT yet run (context stop)

Branch feat/143-steering-adapter-process, WIP commit 578c82e on top of qa's tests (91ec59e). The cell hit the 80k context stop right after writing the code, so nothing has been run. Treat the code as an untested first draft.

## What was written

- apps/bridge/cells/claude-runtime.mjs (new): createClaudeRuntime with an env option. Binary from DEN_CLAUDE_BIN, else claude. Spawns detached, shell false, argv from buildClaudeArgs, env from buildClaudeEnv. Waits for the child's spawn or error event (rejects on error). Prompt is one stdin line. stderr drained with resume(). stdout goes through createLineSplitter, then control_request lines through decodeControlRequest (approval held in a map and emitted as permission-request; deny answered on stdin with no event), else parseClaudeLine. decide uses encodeControlResponse (unknown id writes nothing). signal does process.kill on the negative pid and is a no-op after exit. On leader exit the group gets a SIGKILL to reap grandchildren. closeInput ends stdin. Capabilities: spawn, stop, approve true, send false, handover true. resumeCommand returns claude --resume plus the uuid, or null for a non-UUID.
- apps/bridge/server.mjs: the production main now passes createClaudeRuntime(process.env) to startBridge.
- apps/bridge/cells/policy.mjs: SHUTDOWN_SPAWN_WAIT_MS = 3000.
- apps/bridge/cells/host.mjs: policy.spawnWaitMs (can only lower the constant). shutdown() races the pending spawns against the bound. Past it: killAllSync() (first call SIGKILL), then wait on finished. In bound it keeps the graceful terminate path. A late spawn is still terminated by spawnAgent (the shuttingDown check).

## For the next developer cell

1. Run node --test on the four qa files: claude-process.test.mjs, claude-runtime-host.test.mjs, claude-runtime-shutdown.test.mjs, host-shutdown-bounded.test.mjs. Then npm test. Fix failures in the implementation, never in qa's tests.
2. Watch: the group reap on exit may interact with the SIGKILL-ends-a-child-that-ignores-SIGTERM test timing; stdout close ends the event stream (the host races a 250 ms drain anyway); in the bounded path finished should resolve once SIGKILL lands.
3. Then run /code-review, write the final handoff, and release at in-review. The user runs a manual conformance check after merge. S8 capabilities: used the pinned approve true (outcome c) from qa.

## State

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "developer",
  "current_step": "implementation committed as WIP (578c82e); tests not run; context stop at 82k",
  "artifacts": [
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/policy.mjs",
    "apps/bridge/cells/host.mjs",
    "apps/bridge/server.mjs"
  ],
  "decisions": [
    "Group SIGKILL on leader exit to reap grandchildren (AC: no grandchild survives a kill)",
    "SHUTDOWN_SPAWN_WAIT_MS is 3000 ms; past it shutdown uses killAllSync",
    "resumeCommand returns null for a non-UUID session id"
  ],
  "failures": [
    "context budget stop before any test run"
  ],
  "pending": [
    {
      "item": "Run the four 143 test files and npm test, fix failures, code-review, final handoff, release in-review",
      "owner": "developer"
    }
  ]
}
```
