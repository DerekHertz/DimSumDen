# Handoff: ci-cd/02 headless UI smoke check — qa specify

**From:** qa (specify)
**Branch:** `qa/ci-cd-02-headless-ui-smoke` (worktree `agent-a23cfa9e98c016d4d`, based on main `eea046a`)
**Ticket:** `.scratch/ci-cd/issues/02-headless-ui-smoke.md`

## What's on the branch

Two new test files plus fixtures, following the repo's `*.test.mjs` / `node --test`
convention (they're picked up by the root `apps/**/*.test.mjs` glob already, no
`package.json` changes needed):

- `apps/ci-cd/dev-server.test.mjs` — tests `npm run dev`
- `apps/ci-cd/smoke.test.mjs` — tests `npm run smoke`
- `apps/ci-cd/fixtures/ok-page.html` + `.mjs` — a clean dev page (no errors, no
  imports) that smoke must pass
- `apps/ci-cd/fixtures/node-import.html` + `.mjs` — reproduces ticket 07's bug:
  a browser module importing `node:fs`, which smoke must fail

All four tests were run against today's main (no `dev`/`smoke` scripts exist
yet) and fail cleanly on `npm error Missing script: "dev"` / `"smoke"` — not on
a syntax or setup error in the test files.

## Criterion → test map

| Acceptance criterion | Test | Status |
|---|---|---|
| `npm run smoke` serves the repo, loads each listed dev page headless, reports the first error of each kind | `smoke.test.mjs` — "passes a dev page with no console errors, import failures, or asset failures" | failing (missing script) |
| A browser page importing a `node:` built-in makes it fail (tested) | `smoke.test.mjs` — "fails when a dev page imports a node: built-in" | failing (missing script) |
| Choose the headless browser (Playwright), security assesses it | N/A — dependency/gate decision, not a test | human-verified (already decided in ticket comments; security reviews it) |
| CI runs it once ci-cd/01 lands | N/A — CI wiring, not testable at this seam | human-verified |
| Runs the full code relay | N/A — process, not code | human-verified |
| Dev server: `.mjs` as `text/javascript`, `Cache-Control: no-store`, takes a port argument | `dev-server.test.mjs` — both tests | failing (missing script) |

## Seams chosen (please confirm or adjust)

The ticket doesn't pin down the exact CLI shape, so I picked the simplest
interface consistent with "takes a port argument" / "loads each listed dev
page":

- `npm run dev -- <port>`: starts the dev server on that port, serving the
  repo root. Test fetches `/apps/ui/src/scene/dev-scene.mjs` and
  `/apps/ui/src/scene/dev-scene.html` through it.
- `npm run smoke -- <page-path> [<page-path> ...]`: serves the repo itself
  (starts its own ephemeral server — the ticket says smoke "serves the repo"),
  loads each given page headless, and exits non-zero if any page has a console
  error, a failed module import, or a failed asset load.

If you implement a different CLI (e.g. a config file listing pages instead of
argv), that's fine — flag it in your handoff so verify can adjust the test
invocation rather than bounce on a seam mismatch.

## Known blocker: Playwright isn't installed

Per the ticket, Playwright is a brain-gate dependency the developer adds (I
didn't install it). Once `npm run smoke` exists but before Playwright lands
in `node_modules`, expect the smoke tests to fail with an import/require
error for `playwright` (or `@playwright/test`) rather than the assertions
above — that's expected, not a bug in the tests.

## Environment issues

None. `npm test`, `node --test`, and `npm run dev -- <port>` (which fails with
"Missing script" as expected) all ran fine on Windows in this worktree.
