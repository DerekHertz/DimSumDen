```json
{
  "ticket": "organism-infra/114-resolve-undo-foreign-lock",
  "cell": "security",
  "current_step": "Security pass-with-nits on fix/114-resolve-undo-foreign-lock (9db4ab5): no critical/high findings; two medium and three low non-blocking findings recorded below.",
  "artifacts": [
    "apps/organism-infra/board-service.mjs:1314-1337",
    "apps/organism-infra/board-resolve.test.mjs:351-405"
  ],
  "decisions": [
    "Verdict is pass: nothing here reaches critical or high. The undo never touches a non-orchestrator lock in the tested interleaving, and the residual races need an explicit reclaim or a second concurrent orchestrator resolve.",
    "Dependencies unchanged (no package.json or lockfile change), so no npm audit gate. gitleaks over main..fix/114 (2 commits): no leaks."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Optional follow-up ticket: make the undo verify the holder under the write lock (release option such as expectCell) and/or only undo when this invocation's own claim() succeeded (findings 1 and 2).",
      "owner": "developer"
    }
  ]
}
```

## Summary

Reviewed the +19/-7 catch block in `resolve()` and the new tests. Scope: TOCTOU on the lock holder check, untrusted lock text in errors, test-only mkfifo/child_process use.

## Findings

1. MEDIUM - `apps/organism-infra/board-service.mjs:1323-1328`. TOCTOU between the holder check and the forced release. The catch reads the lock outside the write lock, decides `holder === "orchestrator"`, then calls `release(..., { force: true })`. `release` re-reads the lock under the write lock (lines 991-998) but `force` only bypasses the handoff check; it never re-asserts the holder. A foreign claim cannot be created over an existing lock (`claim` fails on `ticket already claimed`), so the only way a foreign cell appears in the window is `board reclaim` (line 779), which replaces the lock atomically under the write lock. If that lands between the read at 1323 and the release's own read, resolve force-releases the other cell's claim: status reset to `item.status`, lock unlinked, a comment stamped with the other cell's name ("resolve failed; claim undone"). The window widens if the write lock is contended (release waits for it, and a reclaim in flight is exactly the contender). Impact is bounded: it needs a deliberate reclaim in a millisecond-scale window, the action is audited as a release event with `force: true` plus an override event, and the damage is recoverable. It is still a hole in the 114 invariant ("a lock held by any other cell is never released"). Fix: pass an `expectCell: "orchestrator"` (or similar) option into `release` and check it next to the lock read at line 993, under the write lock.

2. MEDIUM - `apps/organism-infra/board-service.mjs:1291, 1325-1326`. Identity is by cell type, not by invocation. Lock files carry no pid or session (see the comment at 776). If two `board resolve` runs overlap on the same ref (or any other orchestrator-held claim lands between phase 1 and line 1291), the second `claim()` fails with `ticket already claimed`, the catch sees holder `orchestrator`, and force-releases the first run's live claim mid-flow. The first run's later `release` then fails with a no-claim error, leaving a half-resolved batch. Fix: set a local `claimed = true` after `claim()` returns at 1291 and undo only when it is true. That also removes the need for the holder read in the common case, and closes this without a lock-format change. Not tested: the new tests cover a developer holder only.

3. LOW - `apps/organism-infra/board-service.mjs:1319-1321`. The branch `readStatus(content) === "resolved"` pushes the ref into `done` regardless of whether this invocation wrote it. If a concurrent process resolved the ticket after phase 1 and this run's claim failed, the failure report lists it under `resolved:` as ours. Reporting accuracy only, no state change. Same fix as finding 2 narrows it (only trust the status when `claimed` is true).

4. LOW - `apps/organism-infra/board-service.mjs:1334` (and the older 1277). `holder` is the first whitespace-delimited token of the lock file and is interpolated into the error text. Newlines and carriage returns cannot get through (`\s` covers LF, CR, U+2028, U+2029, NBSP), so log-line forging is not possible here. Other control bytes (ESC `\x1b[...`, BEL, NUL) in a hand-edited or corrupted lock file would reach stderr raw through `console.error` at `board.mjs:170`, where a terminal would interpret them. Only the local user can write the lock file, `resolve` runs on the CLI (the bridge never calls it, so nothing reaches the UI), and the same echo already existed at line 1277 and line 1004, so the new line adds no new class. Hardening if wanted: print `JSON.stringify(holder)` or validate against `KNOWN_CELLS`, falling back to `unknown`. A corrupt or empty lock yields `unknown` and is left untouched, which is the safe direction.

5. LOW - `apps/organism-infra/board-resolve.test.mjs:351-405`. Test hygiene, not a vulnerability. `mkfifo` and `execFileSync` (line 361, fixed argv, no shell, path under a `mkdtemp` fixture) are used only in this test file and nothing imports it from product code. The fifo lives in `fx.root`, removed by `fx.cleanup()`. If an assertion fires before the pipe is drained, the child stays blocked in `open()` until `runBoard`'s 15 s timeout kills it (SIGTERM, `board-fixture.mjs:161-165`), so a failing run can leave a stray node process for up to 15 s after the fixture is deleted. Harmless, but a `finally` that opens the fifo non-blocking for read (or kills the child) would end it immediately. Also note the test exercises the claim-failure path against a developer lock, not the reclaim race in finding 1.

## Verified

- `node --test apps/organism-infra/board-resolve.test.mjs` at 9db4ab5: 18 pass, 0 fail.
- `gitleaks detect --log-opts="main..fix/114-resolve-undo-foreign-lock"`: no leaks (2 commits).
- No dependency, workflow, or lockfile changes in the diff.
- Findings 1-3 are from reading the code, not reproduced with a probe.
