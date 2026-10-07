# 168 developer handoff

Branch `feat/168-serialize-full-test-runs` (commit 1927f81, on top of qa tests 99471e8). Added `scripts/test-lock.mjs` and routed the `package.json` `test` script through it. All 11 tests in `scripts/test-lock.test.mjs` pass; full `npm test` ran green (2245/2245) via scout and left no lock file behind.

## How it works

- Lock is a file (default `<os.tmpdir()>/dim-sum-den-test.lock`, outside the repo) holding `{pid, cwd, token}`. Created by hard-linking a fully written temp file, so it appears atomically with its content and fails with EEXIST if held.
- Waiter prints one line: `test-lock: waiting for the test lock held by pid N, worktree <cwd>`, then polls (default 500 ms) until the 15 minute bound; then prints `timed out ...` and exits 1 without running the command.
- Stale lock (holder pid not alive, or unreadable content): renamed aside, then retried.
- Command runs with inherited stdio; its exit code passes through. SIGINT/SIGTERM/SIGHUP are forwarded to the child (SIGKILL after 5 s), the lock is released, and the wrapper exits 128+signal. Release only removes the lock if the token is still ours.

## Notes for reviewers

- Known limits: pid reuse could make a stale lock look live (wait ends at the bound); the stale-takeover rename has a tiny race between two simultaneous takers.
- No env marker is exported to the child, so the wrapper's own tests (which run inside `npm test`) use a private `TEST_LOCK_PATH` and do not deadlock.
- Human-verified item: default lock location is under `os.tmpdir()`.

```json
{
  "ticket": "organism-infra/168-serialize-full-test-runs",
  "cell": "developer",
  "current_step": "Wrapper implemented and package.json wired; 11 acceptance tests and the full suite (2245) pass; committed 1927f81 on feat/168-serialize-full-test-runs.",
  "artifacts": [
    "scripts/test-lock.mjs",
    "package.json (test script)"
  ],
  "decisions": [
    "Lock is an atomically linked file with pid, cwd, token; stale detection by pid liveness",
    "Signals forwarded to the child; wrapper exits 128+signal after releasing the lock",
    "No env marker exported to children"
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify (light), then npm run risk-check, then PR and merge",
      "owner": "qa"
    }
  ]
}
```
