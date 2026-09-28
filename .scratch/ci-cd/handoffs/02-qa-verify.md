# Handoff: ci-cd/02 headless UI smoke check — qa verify

**From:** qa (verify)
**Branch:** `claude/ci-cd-02-headless-ui-smoke` (worktree `ci-cd-02-dev`), commit `f13b165`
**Ticket:** `.scratch/ci-cd/issues/02-headless-ui-smoke.md` (Status: in-review, unchanged)

## Verdict

QA pass. See ticket `## Comments` for the full criterion-by-criterion writeup.

## What I did

1. Fixed my own test's Windows cleanup bug (developer flagged it in Comments/handoff,
   did not touch it, per their genome). `apps/ci-cd/dev-server.test.mjs`'s `stopServer()`
   called `child.kill()` on a `spawn("npm", [...], {shell:true})` child; on Windows that
   only kills the outer `cmd.exe`, orphaning the real `node dev-server.mjs` process and
   hanging `npm test` forever (it inherits the worker's stdio pipes). Now branches on
   `process.platform === "win32"` to `taskkill /pid <pid> /t /f` instead. No assertions
   changed — diffed the whole file against my specify commit `a992853`.
2. Ran the isolated test file, then the full suite, both under an external timeout as a
   safety net (neither needed it): `npm test` exits on its own, code 0, 46/46 pass,
   ~5s wall time.
3. Confirmed no leftover process: `Get-CimInstance Win32_Process` for `node.exe`/`cmd.exe`
   matching `dev-server.mjs`/`ci-cd-02`/`npm.*dev` returned nothing after the run.
4. Diffed `smoke.test.mjs` and `apps/ci-cd/fixtures/*` against `a992853`: no changes: the
   developer's claim of not touching qa's tests holds for those files too.
5. Walked every acceptance criterion in the ticket against the current branch (see
   Comments for the map). CI wiring is out of scope per the orchestrator (ci-cd/01).

## Next step

`security` reviews the Playwright dependency (exact pin `1.63.0`, `package-lock.json`
committed, no install/postinstall scripts per the developer's report — I confirmed the
files exist but didn't re-audit the lockfile or scripts myself, that's security's job).
Then a merge proposal.

## Environment issues

None. Windows process-tree kill worked as expected once implemented; no orphaned
processes, no lock conflicts. I killed no external processes (only ones I spawned
myself during my own test runs, and they exited on their own via `taskkill`/`child.kill()`
inside the test).
