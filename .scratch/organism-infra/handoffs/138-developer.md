# 138 developer handoff (partial, context budget)

Outcome: partial. No code was written. Reading the 653-line `conformance.mjs`, the new tests (lines 563 to 980 of the test file) and the ADR decision 7 text took the session to 76k tokens before the first edit, so I stopped at the 80k rule. Worktree branch `feat/138-steering-spike-tooling` is at the qa tests commit `95ecff6` with no changes on top. The next developer should NOT read the jg context file or the ADR (both large); the notes below replace them.

```json
{
  "ticket": "organism-infra/138-steering-spike-tooling",
  "cell": "developer",
  "current_step": "Read conformance.mjs and the tests for CLI, S3 fixes, scrub and S8; designed S8 and the shared pieces; nothing implemented, nothing committed",
  "artifacts": [
    "branch feat/138-steering-spike-tooling @ 95ecff6af00eaef5c405f4044b2816031d928025 (qa tests only)"
  ],
  "decisions": [
    "Design notes below are the developer's plan, not yet verified by running tests"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement in apps/bridge/cells/conformance.mjs: CLI options, S3 fixes, scrubText, S8, S4b, S6b, S3b to the qa contract (handoff 138-qa-specify.md); run npm test; release at in-review",
      "owner": "developer"
    }
  ]
}
```

## Plan, in order (cheapest reading first)

Work in vertical slices, one `node --test apps/bridge/cells/conformance.test.mjs` run per slice. Read the test file only by slice: CLI 563-630, S3 632-717, scrub 719-772, S8 774-975, S4b 977-1097, S6b 1099-1230, S3b 1232-1280 (S4b, S6b, S3b tests not read yet by me).

1. **CLI** (`parseCli`, ~line 586): add `repo:null`, `s8DisableFlags:[]`, `s8DisableEnv:{}` (split `NAME=VALUE` at first `=`; no `=` is an error), `s3bWaitMs:90000` (`--s3b-wait <s>`, must be a positive finite number). The default `opts.spikes` must stay S1..S7: use `Object.keys(SPIKES).filter(k => /^S[1-7]$/.test(k))`. `--spike` matching: build a case-insensitive map `{lowercase id: id}` over SPIKES keys, accept `s8,s4b,S6B`, keep SPIKES order, error text includes the uppercased bad token (`S9`). Register `S8, S4b, S6b, S3b` in SPIKES after S7 in that key order, each with `title` and integer `turns`; total of the four must be 8 to 12 (suggest S8 3, S4b 4, S6b 1, S3b 3... adjust: the ADR says 8 to 12 in total; pick S8 3, S4b 2, S6b 1, S3b 3 = 9). `planText`/dry-run need no change beyond the registry; the dry-run must not create a worktree (S6b runs only in `runSpikes`). Add the new flags to HELP. `main()` passes `repo`, `s8DisableFlags`, `s8DisableEnv`, `s3bWaitMs` through to `runSpikes`.
2. **S3 fixes**: in `evaluateS3` pick the Write request (`controlRequests(allow).find(r => r.request?.tool_name === "Write")`, same for deny) instead of `[0]`; add `shapes.requestSubtype = reqA?.request?.subtype ?? null` (nested only, never the top-level `subtype`) and an evidence line `request.subtype: <value>` (the regex is `/request\.subtype\W+can_use_tool/`; when absent still print `request.subtype` with `undefined`/`absent`). In `runS3` answer `allow` only when `o.request?.subtype === "can_use_tool" && o.request.tool_name === "Write"`, else `deny`; the deny phase denies everything. The phase flag currently picks the decision for all requests, so compute per request. The test fake `FAKE_S3_MIXED` asks Bash first then Write in each phase and records answers.
3. **scrubText(text, { homes, username })**: for each home (strip trailing slashes, skip empty or "/", sort longest first) replace all occurrences with `~`; replace username (if length >= 1) everywhere with `<user>`; output stays valid JSON (replacements contain no quotes or backslashes). `writeCaptures` runs it with `homes: [opts.env?.HOME, homedir()]` and `username: userInfo().username`; pass these via ctx (add `ctx.scrub = { homes, username }`). Import `userInfo` from node:os. The saved fixture test checks the HOME dir string, `homedir()` and the username are all absent; note `results.json` evidence strings may also contain paths: scrub them too (cheap: `scrubText(JSON.stringify(results))`).
4. **S8** (test fake at test lines 884-952; read it before writing). `evaluateS8` rules are in the qa handoff. Choices I made: outcome a = no `socketPath` (verdict go); refused/not connected = go b; any `control-response` effect = no-go d; else any message/interrupt effect = residual c; else non-empty `connect.unsolicited` = residual c with an evidence line saying unsolicited bytes (event leak); else every probe `reply === null` (or no probes) = unconfirmed (outcome null); else go b. A `disable` candidate with `socketGone && loggedIn` turns any non-go verdict into go with `disabledBy: via`. Evidence: socket path, capabilities, `stat` (type, octal mode, uid vs ownUid, dir mode, a line containing the word `others` whether or not it is open: flag if `mode & 0o006` or `dirMode & 0o007`), connect result, and one line per probe containing its exact `shape` string, reply and effect. Runner plan: spawn with `permissionPromptTool:"stdio"`, `allowedTools:["Bash(sleep 15)"]`; turn 1 prompt `Run the Bash command "sleep 15", then reply done.` (must not contain the word "write"); wait for `isToolUse`; read `init.messaging_socket_path` and `init.capabilities` from `initOf`; none: finish and evaluate outcome a. Else `fs.statSync` the socket and its dir, `net.createConnection`, collect bytes for 2 s (unsolicited), then send the four probes with a 2 s wait each, recording the reply bytes; nonce probe effect = an assistant line echoes the nonce; interrupt effect = a tool_result with `is_error` or arriving early; wait for the turn-1 result; turn 2 prompt `Use the Write tool to create <dir>/s8.txt with content x.` (contains no "sleep"), wait for `isControlRequest`, send the `control_response` allow naming its `request_id` over the socket, wait 3 s, effect = file exists; then deny on stdin with `controlResponseLine(id, "deny")` and `finish`. Disable candidates (only if a socket existed): `execFile(bin, ["--help"])`, lines matching `/socket|messaging|inbound/i`, flags via `/--[a-z][a-z0-9-]*/g`, plus `s8DisableFlags` and `s8DisableEnv` entries; each candidate spawns a fresh child (so `ctx.start(args, cwd, extraEnv)` needs an optional env merge) with a one-word prompt, `socketGone = !init.messaging_socket_path || !existsSync(path)`, `loggedIn` = a non-error result. Always `kill("SIGKILL")` in a `finally` and `socket.destroy()`; the tests check that no child pid (`$HOME/children.txt`) survives.
5. **S4b, S6b, S3b**: not started. Read the test blocks and the qa handoff contract (`evaluateS4b`, `evaluateS6b`, `evaluateS3b`, `timing`, `repo`). S4b leftovers: find `sleep 61` pids with `ps -axo pid,pgid,ppid,command` and SIGKILL at the end, plus the child pid (group step spawns `detached:true`, signal `-pid`); the `Child` class needs a `detached` option and a `pid`. S6b: `git worktree add --detach` under `<repo>/.claude/worktrees/s6b-<random>`, `git worktree remove --force` in a `finally`.

## Comments

Environment: the dispatch used `--continue` and cell-start created the claim; the ticket is `claimed`. I released with `--keep-status` (no in-review: the work is not done).
