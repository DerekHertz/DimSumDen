# 138 qa specify handoff

Branch `tests/138-steering-spike-tooling`, tests commit `95ecff6af00eaef5c405f4044b2816031d928025` (base `7c2eee1`). One file changed: `apps/bridge/cells/conformance.test.mjs`. 82 tests: 37 existing pass, 45 new or changed fail, each for a missing feature (unknown spike id, `not a function`, missing option), none for setup or import. The round-2 exports are reached through `import * as conf` so a missing export fails its own tests, not the whole file.

```json
{
  "ticket": "organism-infra/138-steering-spike-tooling",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing acceptance tests committed on tests/138-steering-spike-tooling (95ecff6); developer implements conformance.mjs to make them pass",
  "artifacts": [
    "apps/bridge/cells/conformance.test.mjs",
    "branch tests/138-steering-spike-tooling @ 95ecff6af00eaef5c405f4044b2816031d928025"
  ],
  "decisions": [
    "Default run (no --spike) stays S1 to S7; S8, S4b, S6b, S3b run only when named (ADR: the user passes --spike S8,S4b,S6b,S3b)",
    "SPIKES key order is S1..S7, S8, S4b, S6b, S3b; the existing 'SPIKES describe every spike' test was updated to that list (scope change, not a loosening)",
    "Interface names are qa's choice because the ticket names none: evaluators and result fields below; the developer may not rename them without telling qa",
    "Verdict 'residual' is a new verdict value used only by S8 outcome c",
    "S8 e2e fakes cover outcomes a and d only; b, c, unconfirmed are covered by the pure evaluator tests (a fake would need real 15 s sleep timing)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement to the contract in this handoff, run npm test, release at in-review",
      "owner": "developer"
    },
    {
      "item": "Light verify afterwards (qa specified): git diff 95ecff6 HEAD on the test file must show no loosened assertion",
      "owner": "qa"
    }
  ]
}
```

## Criterion to test map

1. Each new spike's evaluator is a pure function with tests against a scripted fake: `S8 ...` (9 evaluator tests, 2 fake-runner tests), `S4b ...` (5 evaluator, 3 fake-runner), `S6b ...` (6 evaluator, 3 fake-runner), `S3b ...` (5 evaluator).
2. Fixtures scrubbed: `scrubText removes home paths...`, `runSpikes saves scrubbed fixtures: no home path, no username`.
3. Leftover cleanup tested with the fake: the three `runSpikes S4b ...` tests (every recorded `sleep 61` pid and child pid is dead after the run, including a detached sleep that outlives the group signal and a child that ignores EOF); `runSpikes S6b ...` removed-worktree tests (normal, child crash).
4. S3 allow answers only Write and nested subtype: `runSpikes S3: the allow phase answers only Write...`, `S3 evaluator reports the nested request.subtype shape`, `S3 evaluator does not mistake a top-level subtype...`, `S3 evaluator, allow run with an earlier non-Write request...`.
5. No real claude in npm test: every `runSpikes` test passes `claudeBin: <fake>`; the dry-run test sets `DEN_CLAUDE_BIN=/nonexistent/claude`. Not separately testable beyond that; qa verify should grep the diff for any other `claude` spawn.
6. CLI scope (ids case-insensitive, `--repo`, `--s8-disable-flag/-env`, `--s3b-wait`, turns 8 to 12 in total, dry-run): the `parseCli ...`, `SPIKES: the four round-2 spikes...` and `--dry-run with the round-2 spikes ...` tests.

Nothing is `human-verified` for this ticket's criteria; the real spike runs are the user's, afterwards.

## Contract the tests fix (names the developer must export or accept)

- `parseCli`: `opts.repo` (string, default null), `opts.s8DisableFlags` (array), `opts.s8DisableEnv` (object, `NAME=VALUE` split at the first `=`, missing `=` is an error), `opts.s3bWaitMs` (default 90000, must be positive). `--spike` matches ids case-insensitively against the `SPIKES` keys and keeps `SPIKES` order.
- `runSpikes` options: `repo` (S6b), `timing` for S4b `{ settleMs (default 1500), eofPollMs (15000), termCheckMs ([2000, 10000]) }` so tests can shrink the waits.
- `scrubText(text, { homes: [paths], username })`: removes each home path and the username everywhere, keeps lines valid JSON. `runSpikes` scrubs saved fixtures with both `opts.env.HOME` and `os.homedir()` and `os.userInfo().username`.
- `evaluateS3`: result gains `shapes.requestSubtype` (the nested `request.subtype`; not the top-level `subtype`) and an evidence line containing `request.subtype` and its value. It judges the Write request, not just the first request.
- `runS3` allow phase: answer `allow` only to a `can_use_tool` request whose `tool_name` is `Write`; deny everything else.
- `evaluateS8({ init:{socketPath,capabilities}, stat:{type,mode,uid,ownUid,dirMode}|null, connect:{connected,error?,unsolicited,greeting}|null, probes:[{name,shape,reply,effect}], disable:[{via,socketGone,loggedIn}] })` returns `{ spike:"S8", verdict: go|residual|no-go|unconfirmed, outcome: a|b|c|d, disabledBy?, evidence }`. Probe names: `user-message`, `interrupt-control-request`, `interrupt-bare`, `control-response`. Rules as ADR decision 7: no socket path is a go (a); refused connection or error replies with no effect is go (b); silence with no effect is unconfirmed; message or interrupt effect only is residual (c); control-response effect is no-go (d); unsolicited bytes are never a plain go; evidence lists every `shape`, the capabilities, and flags `others` access from `mode`/`dirMode`; a disable candidate counts only if `socketGone && loggedIn`, then verdict go with `disabledBy`.
- `evaluateS4b({ eof:{exited,survivors}, term:{exited,exitMs,survivorsAt2s,survivorsAt10s}, kill:{survivors}, group: null | {term:{survivors},kill:{survivors}} })` returns `{ verdict, decision: plain|group-kill, evidence }`. EOF not exiting mid-call is no-go with `EOF` in evidence; group survivors after `kill` is no-go.
- `evaluateS6b(capture, { allowedExists, deniedExists })`: go needs the allowed file, no denied file, no `mcp_servers` entry with `source` of `user` or `claudeai`, no plugin whose `path` is not `builtin`; stderr matching "not trusted" with the allow not applied is `unconfirmed` with evidence mentioning trust and worktree. Runner: `git worktree add --detach <repo>/.claude/worktrees/s6b-<random> HEAD`, writes `.claude/settings.local.json` (allow `Write(allowed.txt)`, `Write(.claude/**)`) and the probe role, spawns with `--setting-sources project,local`, `--strict-mcp-config`, `--agent probe`, and `--settings '<inline JSON with permissions.deny ["Write(.claude/**)"]>'`; always removes the worktree; a non-git `--repo` returns a not-go result.
- `evaluateS3b({ subagent, wait, omitted }, { waitMs, omittedFileExists })` returns `{ verdict: go|unconfirmed (never no-go), behavior:{ subagentRequest: reaches-parent-identified|reaches-parent-unidentified|absent, wait: denied|exited|hung, updatedInputOmitted: honoured|rejected }, evidence }`. A subagent request is identified by a truthy `parent_tool_use_id` on the line. `unconfirmed` when the wait or omitted capture holds no `control_request`.
- `runSpikes` result for S8 and S4b must be the evaluator's object (the tests read `outcome` and `decision` from `results[i]`).
- S4b runner: pids of every process whose command is `sleep 61` are found with `ps` and SIGKILLed at the end, plus any child that survived; steps 1 to 4 per ADR, group step spawns the child `detached: true` and signals `-pid`.

## Fake contracts (for the developer reading the tests)

- S8 fake: reacts to stdin user messages whose text matches /sleep/i (a short fake tool call) and /write/i plus a `\S+.txt` path (a `can_use_tool` request, id `req_s8`); optional Unix socket at `$HOME/m.sock`; `claude --help` prints one usage line. A `control_response` over the socket naming `req_s8` with `allow` creates the file (outcome d).
- S4b fake: spawns a real `sleep 61` and logs pids to `$HOME/sleeps.txt` and `$HOME/children.txt`.
- S6b fake: records argv, cwd and the worktree's settings to `$HOME/s6b-seen.json`.

## Comments

None of the new tests were run green; the developer is the first to see them pass. qa did not run `npm test` in full (the existing suite outside this file is untouched).
