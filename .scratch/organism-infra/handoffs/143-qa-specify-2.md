# 143 qa specify (round 2): tests written and committed, red-check partly done

Branch `tests/143-steering-adapter-process`, one WIP commit on base 99f760e. The cell hit the context stop (80k) right after the first red run, so the red check is partial and no criterion map has been double-checked.

## Files committed (all under apps/bridge/cells/)

- `claude-stub.mjs` (helper, not a test): `makeStub({mode, grandchild, ignoreTerm})` writes an executable node script that stands in for `claude` (modes approve, hang, crash, flood, utf8, oversize, dup), logs argv/cwd/env keys/stdin lines to jsonl, and can spawn a grandchild. Also `collect(proc)` and `alive(pid)`.
- `claude-process.test.mjs` (16 tests): runtime over real pipes. Capabilities and resumeCommand; argv equals buildClaudeArgs, cwd, prompt line; model; env allowlist; spawn-arg binary ignored; missing binary rejects; events decode + allow echoes input + done + exit 0; deny reason; duplicate id and non-can_use_tool subtype auto-denied, unknown id writes nothing; crash code 3; stderr flood; split UTF-8; oversize line; SIGTERM and SIGKILL reach the process group (grandchild); signal after exit is a no-op.
- `claude-runtime-host.test.mjs` (3 tests): startBridge over createClaudeRuntime and the stub (dispatch, tool/tokens, approval allow reaches stub, stop terminates child and grandchild), plus a `node apps/bridge/server.mjs` subprocess test proving the production entry wires the default runtime (needs PORT, ORGANISM_ROOT, DEN_CLAUDE_BIN; reads `#code=` from stdout).
- `claude-runtime-shutdown.test.mjs` + `claude-runtime-shutdown-probe.mjs` (5 tests): SIGTERM/SIGINT/SIGHUP, uncaught exception and process.exit() leave neither stub nor SIGTERM-ignoring grandchild alive.
- `host-shutdown-bounded.test.mjs` (3 tests): security finding 3. policy.mjs must export `SHUTDOWN_SPAWN_WAIT_MS`; `policy.spawnWaitMs` override; slow spawn past the bound makes shutdown resolve under 1200 ms with the live agent's first call SIGKILL and the late spawn still ended; an in-bound spawn takes the graceful path.

## Pinned interface (also in the head comments of claude-process.test.mjs)

New `claude-runtime.mjs` exporting `createClaudeRuntime({ env })`; binary only from `env.DEN_CLAUDE_BIN` or `claude`; `spawn(bin, buildClaudeArgs(...), {shell:false, detached:true, cwd, env: buildClaudeEnv(env)})`; prompt as one stdin line `{type:"user",message:{role:"user",content}}`; capabilities `{spawn, stop, approve:true, send:false, handover}`; `signal` goes to the process group and never throws; `decide` via `encodeControlResponse`; production `server.mjs` main must pass the default runtime to startBridge.

## Red check

First run of claude-process (16/16) and the first tests of claude-runtime-host failed with "claude-runtime.mjs does not exist yet (missing feature)", which is the right reason. NOT yet seen: the output of claude-runtime-shutdown.test.mjs, host-shutdown-bounded.test.mjs and the production-entry test. Next cell: run those three files and confirm each fails for a missing feature (module not found, missing SHUTDOWN_SPAWN_WAIT_MS, shutdown timing, 503 from production), not for a setup error. Also sanity-check the stub itself (run `node -e` with makeStub in hang mode and pipe a user line) since it has never run without a runtime; a bug there would be a setup error disguised as red. `host-shutdown-bounded` "graceful path" twin test should pass today if the fake behaves as expected; if it already passes, that is fine (a guard), but note it.

## Criterion map

Process half (adapter D2): claude-process.test.mjs. Production entry wiring: claude-runtime-host.test.mjs (subprocess test). Process-group kill and no orphans on exit: claude-process (kill tests) and claude-runtime-shutdown. Finding 3 (bounded shutdown): host-shutdown-bounded. Nothing is marked human-verified.

## State

```json
{"ticket":"organism-infra/143-steering-adapter-process","cell":"qa","current_step":"qa specify partial: four test files plus stub and probe committed; red check done for claude-process and the first host tests only","artifacts":["apps/bridge/cells/claude-stub.mjs","apps/bridge/cells/claude-process.test.mjs","apps/bridge/cells/claude-runtime-host.test.mjs","apps/bridge/cells/claude-runtime-shutdown.test.mjs","apps/bridge/cells/claude-runtime-shutdown-probe.mjs","apps/bridge/cells/host-shutdown-bounded.test.mjs"],"decisions":["Stub binary generated per test via claude-stub.mjs, behind DEN_CLAUDE_BIN, no mocks of the runtime","Production entry tested by running node apps/bridge/server.mjs as a subprocess","Bounded shutdown pinned as policy.spawnWaitMs / SHUTDOWN_SPAWN_WAIT_MS"],"failures":["context budget stop at 80k before the full red check"],"pending":[{"item":"Run the shutdown, bounded and production-entry tests red; sanity-check the stub; fix any setup error in the tests; then hand off to developer","owner":"orchestrator (fresh qa specify cell, or developer may start with the committed tests)"}],"mode":"specify"}
```
