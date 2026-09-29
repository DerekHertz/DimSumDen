```json
{
  "ticket": "dimsumden-ui-v0/13",
  "cell": "qa",
  "mode": "specify",
  "current_step": "qa specify done: 4 failing tests committed",
  "artifacts": ["tests/dimsumden-ui-v0-13-e2e-smoke @ d2e421e", "apps/ci-cd/smoke-ui.test.mjs"],
  "decisions": [
    "Pinned smoke.mjs URL mode as repeatable `--url <absolute-url>` (ADR 0011 left the flag open). Loaded as given, not joined to the repo dev server.",
    "Pinned `npm run smoke:ui` (ticket's e2e name). It builds the UI, starts the bridge on a fixture .scratch/ tree, and prints one line per check starting with PASS or FAIL naming scene, queue, chart, approve. Exit 0 only if all pass."
  ],
  "failures": [],
  "pending": [{"item": "Add --url mode to apps/ci-cd/smoke.mjs; add smoke:ui script and its runner (fixture board, bridge, browser checks incl. Approve round trip); optionally wire CI", "owner": "developer"}]
}
```

# 13 qa specify handoff

Branch: tests/dimsumden-ui-v0-13-e2e-smoke (commit d2e421e)
Test file: apps/ci-cd/smoke-ui.test.mjs (node --test)

State: done. 4 tests, all red for the right reason.

## Criterion-to-test map
- Ticket's one criterion, "exits non-zero on any failure":
  - test 2 (--url page with failed import exits non-zero, output has FAIL and names the import)
  - test 3 (--url unreachable exits non-zero on navigation)
  - Both are RED now: `--url` is treated as a page path and 404s, so the assertions on the import and the navigation error fail.
- Criterion, "passes on main": test 1 (--url healthy page exits 0) and test 4 (`npm run smoke:ui` exits 0, PASS lines for scene, queue, chart, approve, no FAIL). Both RED (`--url` unsupported; `Missing script: smoke:ui`).
- Scene count, queue order, chart and Approve round-trip contents are asserted only through the PASS line names of smoke:ui. A failing content check cannot be injected from outside without a hook, so the "non-zero on any failure" path of smoke:ui itself is human-verified by a reviewer reading the runner; the URL-mode tests cover the exit-code plumbing.

## Notes for developer
- Tests 2 and 3 first passed for the wrong reason (unknown arg failed); I tightened them to require the import/navigation message and no mangled URL.
- smoke:ui test timeout is 170 s and includes `vite build`. Playwright with Chrome/Chromium is present locally.
- Ticket 13 is blocked-by 08, 10, 11; base ba21a33 has them.

## Suggested skills
tdd, implement
