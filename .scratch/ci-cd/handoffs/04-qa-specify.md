# Handoff: ci-cd/04 smoke fails loudly without deps — qa specify

**From:** qa (specify)
**Branch:** `claude/ci-cd-04-tests` (worktree `agent-a431481198fcaf4fc`, based on main `301bcf0`)
**Commit:** `6a14676eba4e03a3215fc28a3c9f1ef5c80af5e3`
**Ticket:** `.scratch/ci-cd/issues/04-smoke-fail-loudly-without-deps.md`

## What's on the branch

Two new tests added to `apps/ci-cd/smoke.test.mjs` (no new file, follows the
existing `*.test.mjs` / `node --test` convention already in that file), plus a
`makeWorktreeWithoutDeps()` / `runSmokeWithoutDeps()` helper pair.

The helper copies `smoke.mjs` and `dev-server.mjs` into a fresh `os.tmpdir()`
directory with no `node_modules` anywhere in its ancestry, then runs
`node smoke.mjs <page>` from there. Node's ESM resolver walks up from the
*importing file's real path* to find a bare specifier, so this reproduces
"playwright can't resolve" deterministically no matter what this checkout's
own install state is.

**Why not just run `npm run smoke` in this worktree directly:** this worktree
(`.claude/worktrees/agent-a431481198fcaf4fc`) has no `node_modules` of its
own — confirmed, `ls node_modules` errors — but it's nested *inside* the main
checkout's directory tree, so Node's ancestor walk finds the main checkout's
`node_modules/playwright` two levels up and resolves fine. That's real,
worktree-specific behavior, not a workaround: it's why I copied the scripts
out to an unrelated tmp directory rather than trusting this worktree's own
missing `node_modules` to prove the "not installed" case on its own.

The underlying cause named in the ticket — a fresh agent worktree has no
`node_modules`, so `playwright` genuinely fails to resolve, not a bug in the
test or the smoke script — is the exact thing both new tests simulate.

## Criterion → test map

| Acceptance criterion | Test | Status |
|---|---|---|
| Missing playwright → one-line message, no stack | `smoke.test.mjs` — "smoke names the real cause with one clear line and no stack trace when playwright is not installed" | failing for the right reason: today it dumps the raw `ERR_MODULE_NOT_FOUND` stack (asserted absent) instead of a `playwright not installed` message |
| Installed → unchanged, CI green, smoke passes 2/2 in main | Existing tests in this file — "passes a dev page with no console errors..." and "fails when a dev page imports a node: built-in" | passing (both already pass here, since this worktree does resolve the real `playwright` via the ancestor walk described above) |
| Missing dep still fails, never skips | `smoke.test.mjs` — "smoke does not silently skip when a dependency is missing -- it still counts as a failure" | **passing already** — today's raw crash already exits non-zero and never skips. Kept as a regression guard: the AC1 fix must not accidentally turn this into an exit-0 skip while adding the friendly message. |

No criterion needed `human-verified` — all three are testable at the `npm run smoke` / `node smoke.mjs` CLI seam.

## Note on the one test that already passes

Per the loop's "red before green" rule I'd normally expect every new test to
fail before implementation. The skip-guard test doesn't, because the
behavior it protects (non-zero exit, no skip) is already true of the
*current* crash — there's nothing to build for that criterion in isolation,
only something to not regress while building AC1's message. Flagging this
explicitly rather than silently shipping a test that was never red.

## Full suite run

`node --test apps/ci-cd/smoke.test.mjs`: 4 tests, 3 pass, 1 fail (the new
one-line-message test, failing on the real `ERR_MODULE_NOT_FOUND` stack as
expected — not a setup/import error in the test file itself).

## Environment issues

None blocking. Worth noting for future cells: worktrees under
`.claude/worktrees/` inside this main checkout inherit the main checkout's
`node_modules` via Node's normal ancestor-directory resolution, even with no
`node_modules` of their own. That means "missing node_modules" bugs won't
always reproduce by just running commands in-place in one of these
worktrees — as seen here, where `npm run smoke` worked fine despite this
worktree having no `node_modules` directory at all.
