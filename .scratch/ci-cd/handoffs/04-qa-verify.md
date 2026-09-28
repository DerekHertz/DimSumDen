# Handoff: ci-cd/04 smoke fails loudly without deps — qa verify

**From:** qa (full verify — developer's fix built on a prior qa specify pass at
commit 6a14676; this session did not write the tests, so full verify applies)
**Branch:** `claude/ci-cd-04-tests`
**Commit checked:** `36a812e` (developer's, on top of qa's `6a14676`, based on main `301bcf0`)
**Ticket:** `.scratch/ci-cd/issues/04-smoke-fail-loudly-without-deps.md`

## Verdict: QA bounce

## Evidence

**Full suite run** (own worktree, checked out detached at 36a812e, ancestor `node_modules` present):
`node --test apps/ci-cd/dev-server-bind.test.mjs apps/ci-cd/dev-server.test.mjs apps/ci-cd/smoke.test.mjs`
-- tests 7, pass 7, fail 0, cancelled 0, skipped 0. Independently reproduced via `scout`
(same command, same counts). All 4 smoke.test.mjs tests pass individually too.

**Test-file integrity:** `git diff 6a14676 36a812e -- apps/ci-cd/smoke.test.mjs` is empty --
the developer did not touch qa's tests. No weakening.

**Spec check against the ticket** (`.scratch/ci-cd/issues/04-smoke-fail-loudly-without-deps.md`):

- AC1 "With Playwright missing, the smoke test fails with the one-line message above and no
  stack trace" -- the ticket's "What to build" names two distinct triggers: `playwright` missing
  (the package) **or its Chromium binary** missing. `apps/ci-cd/smoke.mjs` implements both
  branches:
  - `loadChromium()` catches `ERR_MODULE_NOT_FOUND` (package not installed) -> `DependencyError`.
  - `launchBrowser()` catches Playwright's "Executable doesn't exist at .../chromium-.../chrome-*"
    (package installed, `npx playwright install chromium` never run) -> same `DependencyError`.

  `apps/ci-cd/smoke.test.mjs` only exercises the first branch: `makeWorktreeWithoutDeps()`
  copies `smoke.mjs`/`dev-server.mjs` to a directory with no `node_modules` anywhere in its
  ancestry, which reproduces the missing-**package** case, not a present-package/missing-**binary**
  case. `grep -i "chromium|executable|binary" apps/ci-cd/smoke.test.mjs` -- zero matches. No test
  exercises `launchBrowser`'s regex-classification branch. This is the gap the developer's own
  post-handoff comment on the ticket already flagged (point 1): "no test exercises the
  missing-Chromium-binary branch, only missing-playwright-package."
  This half of AC1 is not marked `human-verified` in the ticket's `## Comments`, and has no
  passing automated test -- per organism-protocol this is a bounce condition on its own.

- AC2 "With Playwright installed, behavior is unchanged" -- covered, passing (the 2 pre-existing
  smoke tests plus dev-server tests, unchanged code path).

- AC3 "It doesn't silently skip" -- covered by `smoke.test.mjs`'s "does not silently skip" test;
  passes.

**Other gaps from the developer's own comment, not blocking but worth folding into the fix:**
`loadChromium()` maps *any* `ERR_MODULE_NOT_FOUND` to the generic playwright-missing message --
an unrelated resolution failure inside one of playwright's own transitive deps would be
misreported as "playwright not installed." No test distinguishes this from a real missing-package
case; low priority unless it's cheap to add alongside the binary-path test.

## What would turn this to a pass

Add a test that forces `launchBrowser`'s missing-Chromium-binary path -- e.g. point
`PLAYWRIGHT_BROWSERS_PATH` at an empty directory (or otherwise make the installed Playwright
package report a missing executable) and assert the same one-line message and no-skip behavior
as the missing-package test. Until then, half of AC1 is untested.

## Status

Left at `in-review` (relay status unchanged; qa doesn't resolve code tickets). Verdict posted to
the board via `board comment`.
