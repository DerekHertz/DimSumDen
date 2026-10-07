# 168 qa specify handoff

Branch: `tests/168-serialize-full-test-runs` (commit 99471e8, base 356726e). Test file: `scripts/test-lock.test.mjs` (11 tests, all red: `scripts/test-lock.mjs` does not exist, and package.json `test` has no wrapper).

## Contract the tests pin (developer: choose everything else)

- Wrapper `node scripts/test-lock.mjs <cmd> [args...]`: takes the lock, runs the command with inherited stdio, releases it, exits with the command's exit code. No `--` separator.
- Env: `TEST_LOCK_PATH` (lock location; tests never read its contents), `TEST_LOCK_TIMEOUT_MS`, `TEST_LOCK_POLL_MS`. Default path must be outside tracked files (os.tmpdir()); that is human-verified.
- Waiter prints exactly one line matching /wait/i (stdout or stderr), containing the holder pid (wrapper's or its command's) and the holder's cwd. It must not repeat per poll.
- Timeout: non-zero exit, message matching /timed out|timeout/i, command never run, holder unaffected.
- Stale lock: holder SIGKILLed (process group), lock left behind; next run takes over within its bound.
- SIGTERM/SIGINT to the wrapper: wrapper exits non-zero, the running command is stopped too, the lock is freed.
- package.json: `test` script goes through `scripts/test-lock.mjs`, keeps the three globs and `--test`; `pretest` stays `npm run check:bom`; `test:path` does not mention test-lock.

## Criterion map

1. Serialized, waiter names holder: "two runs started together never overlap", "a waiting run prints one line naming the holder's pid and worktree"
2. Release on exit, failure, SIGTERM: "lock is released after a normal exit", "... failing command (exit code passes through)", "... on SIGTERM", plus "... on SIGINT" (ticket body text)
3. Stale takeover: "a stale lock left by a SIGKILLed holder is taken over"
4. Bounded wait: "wait is bounded: exits non-zero with a timeout message and does not run the command"
5. Targeted runs unaffected: "targeted runs take no lock ...", "package.json test script goes through the lock wrapper; test:path does not"
6. Existing tests still pass: verify step (`npm test`)
- human-verified: default lock location is outside the repo.

## Validation

I wrote a throwaway reference wrapper (mkdir lock + owner file, not committed, deleted) and 10 of 11 tests passed; the 11th is the package.json edit. So the tests are satisfiable and not timing-fragile on this machine. Red run takes ~48s because missing-feature waits time out at 8s each.

Note for developer: the new test file runs inside `npm test`, which will itself hold the default lock; the tests use a private `TEST_LOCK_PATH`, so no deadlock. Keep it that way if the wrapper exports any env marker to children.

```json
{
  "ticket": "organism-infra/168-serialize-full-test-runs",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests written and committed on tests/168-serialize-full-test-runs (99471e8); all 11 fail because scripts/test-lock.mjs and the package.json wiring are missing.",
  "artifacts": [
    "scripts/test-lock.test.mjs (branch tests/168-serialize-full-test-runs, commit 99471e8)"
  ],
  "decisions": [
    "Wrapper interface pinned as node scripts/test-lock.mjs <cmd...> with TEST_LOCK_PATH, TEST_LOCK_TIMEOUT_MS, TEST_LOCK_POLL_MS env knobs",
    "SIGINT test added beyond the criteria because ticket body item 2 names it",
    "Default lock location outside the repo marked human-verified"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement scripts/test-lock.mjs and route the package.json test script through it so scripts/test-lock.test.mjs passes",
      "owner": "developer"
    }
  ]
}
```
