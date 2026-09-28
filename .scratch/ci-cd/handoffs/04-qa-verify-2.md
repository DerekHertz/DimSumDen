# Handoff: ci-cd/04 smoke fails loudly without deps — qa verify (round 2)

**From:** qa (full verify — bounced round 1; this session added the missing test itself,
then re-ran verify against the developer's code)
**Branch:** `claude/ci-cd-04-tests`
**Commit checked:** `df3394d` (this session's new test, on top of developer's `36a812e`,
on top of qa's `6a14676`, based on main `301bcf0`)
**Ticket:** `.scratch/ci-cd/issues/04-smoke-fail-loudly-without-deps.md`

## Verdict: QA pass

## What changed since the round-1 bounce

Round 1 bounced because no test exercised `launchBrowser`'s missing-Chromium-binary branch
(package present, browser binary absent) -- only the missing-package branch had coverage.

This session added exactly that test to `apps/ci-cd/smoke.test.mjs`. Note on approach: the
orchestrator's suggested technique (point `PLAYWRIGHT_BROWSERS_PATH` at an empty tmp dir) was
tried first and does not work deterministically on this dev worktree -- `launchBrowser` tries
system Chrome, then system Edge, before Playwright's managed Chromium, and this machine has a
real system Chrome installed under `%ProgramFiles%`. Confirmed empirically that a Windows child
process cannot reliably override `%ProgramFiles%` via its env block (it stays at the real value
regardless of what's passed), so that channel keeps succeeding and masks the missing-binary
case. Instead, the new test stubs the `playwright` package itself in a fresh temp directory (the
same seam the existing missing-package test already uses), with a fake `chromium.launch()` that
always throws Playwright's own `"Executable doesn't exist ..."` message. This keeps the test
black-box (only observes smoke.mjs's exit code/output) and is deterministic on any host,
including this one.

Sanity-checked red-for-the-right-reason: temporarily broke `launchBrowser`'s
`/executable doesn't exist/i` classification in `smoke.mjs`, reran -- the new test failed with
the raw Playwright stack trace (not a syntax/setup error), confirming it tests the real
classification logic. Restored `smoke.mjs` immediately after (verified `git status` shows no
diff on `smoke.mjs`).

## Evidence

**Full suite run** (own worktree, checked out detached at `df3394d`):
`node --test apps/ci-cd/dev-server-bind.test.mjs apps/ci-cd/dev-server.test.mjs apps/ci-cd/smoke.test.mjs`
-- tests 8, pass 8, fail 0, cancelled 0, skipped 0.

**Test-file integrity:** `git diff 6a14676 df3394d -- apps/ci-cd/smoke.test.mjs` shows only
additions (133 insertions, 0 deletions) -- none of qa's or the developer-untouched original tests
were weakened.

**Spec check against the ticket:**

- AC1 "With Playwright missing [or its Chromium binary], the smoke test fails with the one-line
  message above and no stack trace" -- now covered on both branches:
  - missing package: `smoke names the real cause with one clear line and no stack trace when
    playwright is not installed` (qa's original test, unchanged, passing)
  - missing Chromium binary: `smoke names the real cause with one clear line and no stack trace
    when the Chromium binary is missing` (new, passing)
- AC2 "With Playwright installed, behavior is unchanged" -- covered, passing (the 2 pre-existing
  smoke tests plus dev-server tests, unchanged code path).
- AC3 "It doesn't silently skip" -- covered by both the original and the new test's no-skip
  assertions; passes.

No gap remains against the ticket's acceptance criteria. The three secondary observations from
the developer's post-handoff comment (generic `ERR_MODULE_NOT_FOUND` mapping, dependency-check
ordering vs. usage-check) are pre-existing, don't block AC1-3 as written, and are already on the
board for security's attention before sign-off.

## Status

Left at `in-review` (relay status unchanged; qa doesn't resolve code tickets). Verdict posted to
the board via `board comment`.
