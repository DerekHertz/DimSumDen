# 143 qa specify (round 3): red check complete, ready for developer

Branch `tests/143-steering-adapter-process` at 91ec59e. No new commits: the red check found no setup errors, so no test or stub changes were needed. Files and the criterion map are as in 143-qa-specify-2.md.

## Red check results (run this round)

- `claude-runtime-shutdown.test.mjs`: 0 of 5 pass. All five fail at the probe with ERR_MODULE_NOT_FOUND for `apps/bridge/cells/claude-runtime.mjs`. That is the missing feature, not a setup error. Once the runtime exists, these tests will exercise the real kill-on-exit behaviour; they have not been seen running past the import yet.
- `host-shutdown-bounded.test.mjs`: 1 of 3 pass.
  - "the bound is a policy constant" fails: policy.mjs does not export SHUTDOWN_SPAWN_WAIT_MS (actual undefined).
  - "a slow spawn past the bound" fails: shutdown waited 1696 ms for a spawn in flight (must be under 1200).
  - "a spawn inside the bound ... graceful path" passes today. It is a guard for the in-bound path, as expected in round 2. Not a red test.
- `claude-runtime-host.test.mjs`: 0 of 3 pass.
  - Two startBridge tests fail with "claude-runtime.mjs does not exist yet (missing feature)".
  - The production-entry test fails with "production dispatch answered 503: {"error":"no runtime is configured"}". That proves `node apps/bridge/server.mjs` starts, prints its code, honours the env, and has no default runtime wired. The right reason.
- Stub sanity (scratch script, not committed): `claude-stub.mjs` run directly. approve mode emits tool_use then control_request and exits 0 on a control_response; hang mode emits tool_use and stays alive with a SIGTERM-ignoring grandchild whose pid is recorded; utf8 mode emits the full line after chunked writes with a clean result event. The stub logs argv, cwd, env keys and stdin lines. No bug found. The grandchild was killed afterwards (checked, none left).

Combined with round 2 (claude-process 16 of 16 red for the missing module), all 27 tests are red for a missing feature except the one guard test above.

## For the developer

Implement `apps/bridge/cells/claude-runtime.mjs` (`createClaudeRuntime({ env })`), wire it as the default runtime in the production entry of `apps/bridge/server.mjs`, and add `SHUTDOWN_SPAWN_WAIT_MS` plus a `policy.spawnWaitMs` override to policy.mjs with a bounded wait in the host's shutdown. The pinned interface is in the head comments of claude-process.test.mjs and in 143-qa-specify-2.md. Nothing is human-verified.

## State

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "qa",
  "mode": "specify",
  "current_step": "qa specify done: red check complete for all test files, no setup errors, stub sanity-checked; ready for the developer",
  "artifacts": [
    "apps/bridge/cells/claude-stub.mjs",
    "apps/bridge/cells/claude-process.test.mjs",
    "apps/bridge/cells/claude-runtime-host.test.mjs",
    "apps/bridge/cells/claude-runtime-shutdown.test.mjs",
    "apps/bridge/cells/claude-runtime-shutdown-probe.mjs",
    "apps/bridge/cells/host-shutdown-bounded.test.mjs"
  ],
  "decisions": [
    "No test or stub changes in round 3: every failure is a missing feature",
    "host-shutdown-bounded in-bound graceful-path test passes today by design (guard)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement claude-runtime.mjs, wire the production default runtime, and add the bounded spawn wait to the host shutdown so the committed tests pass",
      "owner": "developer"
    }
  ]
}
```
