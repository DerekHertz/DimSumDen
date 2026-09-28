# Handoff: ci-cd/04 smoke fails loudly without deps — developer

**From:** developer
**Branch:** `claude/ci-cd-04-tests` (worktree `agent-a77dfcaded5fbbd2d`)
**Commit:** `36a812e` (on top of qa's `6a14676`, based on main `301bcf0`)
**Ticket:** `.scratch/ci-cd/issues/04-smoke-fail-loudly-without-deps.md`

## What changed

`apps/ci-cd/smoke.mjs`:

- Replaced the static `import { chromium } from "playwright"` with a `loadChromium()`
  helper that does a dynamic `import("playwright")` inside a try/catch. If it fails with
  `ERR_MODULE_NOT_FOUND` (the exact failure a fresh agent worktree hits — no `node_modules`
  at all), it throws a new `DependencyError` carrying the one-line message:
  `smoke: playwright not installed, run npm install && npx playwright install chromium`.
- `launchBrowser()` now also classifies Playwright's own "Executable doesn't exist at
  .../chromium-.../chrome-*" error (package installed, but `npx playwright install
  chromium` never run) as the same `DependencyError` with the same one-line message —
  covers the missing-Chromium-binary half of the ticket.
- `main().catch(...)` prints only `err.message` for a `DependencyError` (no stack), and
  falls back to the old `err.stack` behavior for anything else. Exit code is still 1 in
  both cases — never a skip.

No changes to `apps/ci-cd/smoke.test.mjs` (qa's tests, untouched).

## Test results

`node --test apps/ci-cd/smoke.test.mjs`: **4/4 pass** in this worktree.

- "smoke names the real cause with one clear line and no stack trace when playwright is
  not installed" — pass
- "smoke does not silently skip when a dependency is missing" — pass
- "npm run smoke passes a dev page with no console errors..." — pass (playwright resolves
  fine here via the ancestor `node_modules` the qa handoff describes; unaffected by this
  change)
- "npm run smoke fails when a dev page imports a node: built-in" — pass

## Review

Ran `/code-review` (Standards + Spec axes) against base `301bcf0`. Standards sub-agent
result: no documented repo standard (`CODING_STANDARDS.md`/`CONTRIBUTING.md`) exists, so no
hard violations. Three minor judgement-call smells noted, none blocking:

1. Duplicated Code (light) — the "is this a missing-dependency error" classification
   lives at two throw sites (`loadChromium`'s `ERR_MODULE_NOT_FOUND` check and
   `launchBrowser`'s "executable doesn't exist" regex), both throwing the same
   `DependencyError`.
2. Repeated Switches (light) — `main()`'s catch re-checks `instanceof DependencyError`,
   a third site that has to agree on the same classification.
3. Mysterious Name (very minor) — `DependencyError` is a generic name/empty subclass used
   purely as a message-shape router, with no `.code` to distinguish "package missing" vs
   "binary missing".

None of these block merge; flagging for whoever touches this next if a third
"not installed" signal shows up. The Spec-axis sub-agent was still running when this
handoff was written; its result was not folded in.

## Acceptance criteria

- [x] With Playwright missing, the smoke test fails with the one-line message above and no
      stack trace
- [x] With Playwright installed, behavior is unchanged: CI is green and the smoke test
      passes in the main checkout (verified via the 3 pre-existing tests, unchanged)
- [x] It doesn't silently skip: a missing dependency still counts as a failure (non-zero
      exit, no "skip" in output)

## Status

Released as `in-review` (code ticket — qa verify and security review are next in the
relay; orchestrator resolves after merge, per organism-protocol). Did not open a PR or
merge, per ticket instructions.

## Environment issues

None new. Confirms the qa handoff's note: worktrees under `.claude/worktrees/` inherit the
main checkout's `node_modules` via Node's ancestor-directory resolution, so the missing-dep
path only reproduces via the tmpdir copy the qa tests already set up (`makeWorktreeWithoutDeps`).
