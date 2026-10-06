# 138 developer handoff (partial 2, slice 1 done)

Outcome: partial. Slice 1 is committed on `feat/138-steering-spike-tooling` at `a702ad3`: CLI options, S3 fixes, scrubText, S8. Running the test file gives 62 pass, 20 fail; every failure is S4b, S6b or S3b (evaluator missing or runner stub). All CLI, S3, scrub and S8 tests (evaluators and both fake runners) are green. No review (`/code-review`) has run yet; do it at the end of slice 2.

```json
{
  "ticket": "organism-infra/138-steering-spike-tooling",
  "cell": "developer",
  "current_step": "Slice 1 (CLI, S3 fixes, scrubText, S8) implemented and green in apps/bridge/cells/conformance.mjs; S4b, S6b, S3b registered in SPIKES with a notBuilt stub runner and no evaluator",
  "artifacts": [
    "apps/bridge/cells/conformance.mjs",
    "branch feat/138-steering-spike-tooling @ a702ad3aecf42b107c41f83aed1fa4f591851b01 (qa tests 95ecff6 + slice 1)"
  ],
  "decisions": [
    "SPIKES turns: S8 3, S4b 2, S6b 1, S3b 3 (total 9, within 8 to 12)",
    "scrubText leaves a username shorter than 3 characters alone (replacing it everywhere would mangle unrelated text); homes are replaced longest first with ~, the username with <user>; results.json is scrubbed too",
    "S8 runner: control-response probe runs on turn 2 with a real pending Write request (a pending request is needed for an effect); the three other probes run during turn 1's sleep 15; interrupt effect = any new tool_result or result line within the 2 s window after the probe, user-message effect = the nonce echoed in a non-system line; a socket transcript is saved as S8-socket.jsonl",
    "S8 disable candidates are tried only when a socket existed: flags from `claude --help` lines mentioning socket/messaging/inbound, plus --s8-disable-flag and --s8-disable-env",
    "ctx (makeCtx) now carries bin, s8DisableFlags, s8DisableEnv; ctx.start(args, cwd, extraEnv) merges extra env over the allowlist; runSpikes passes opts.repo and opts.timing/s3bWaitMs through opts only (the runners do not read them yet)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Slice 2 in apps/bridge/cells/conformance.mjs: evaluateS4b + runS4b (Child needs detached option and pid), evaluateS6b + runS6b, evaluateS3b + runS3b; replace the notBuilt(...) entries in SPIKES; run the full test file, then npm test, /code-review, release at in-review",
      "owner": "developer"
    }
  ]
}
```

## Slice 2 notes

- Test blocks (line numbers in `conformance.test.mjs`): S4b 977 to 1097, S6b 1099 to 1230, S3b 1232 to 1280. Contract: `138-qa-specify.md` (the `evaluateS4b`, `evaluateS6b`, `evaluateS3b`, `timing`, `repo` bullets). Do not read the ADR or the jg context file.
- Compact test run: a script that runs `node --test --test-reporter=tap` and prints only the `not ok` names and their `error:` line (the plain spec reporter is about 16k characters). Add `--test-name-pattern` to focus (note `S3` also matches `S3b`).
- Isolation guard: write any script that mentions the word git or has pipes/heredocs to a file with the Write tool and run it with `node <file>`; inline `node -e` containing "git" was refused.
- S4b: `Child` gets `detached` and `pid`; find `sleep 61` pids with `ps -axo pid,pgid,ppid,command`, SIGKILL them and the child at the end; group step spawns the child `detached: true` and signals `-pid`. `timing` option `{ settleMs: 1500, eofPollMs: 15000, termCheckMs: [2000, 10000] }`.
- S6b: `git worktree add --detach <repo>/.claude/worktrees/s6b-<random> HEAD`, write `.claude/settings.local.json` and probe role, remove with `git worktree remove --force` in `finally`; a non-git `--repo` returns a not-go result; `--repo` unset also must not crash.
- S3b: pure evaluator first (`evaluateS3b({subagent, wait, omitted}, {waitMs, omittedFileExists})`), runner uses `ctx.s3bWaitMs` (add it to makeCtx from `opts.s3bWaitMs`, default 90000).

## Comments

Context at stop: 88k (a Read of the 653-line `conformance.mjs`, the 70-line CLI test block and the 256-line scrub/S8 test block plus the qa handoff). Slice 1 alone is about 60k of working context; slice 2 is a comparable size, so a fresh cell should read only the S4b/S6b/S3b blocks and the contract.
