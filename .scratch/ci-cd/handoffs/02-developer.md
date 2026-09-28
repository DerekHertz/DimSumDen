# Handoff: ci-cd/02 headless UI smoke check — developer

**From:** developer
**Branch:** `claude/ci-cd-02-headless-ui-smoke` (worktree `ci-cd-02-dev`), on qa's `a992853`
**Ticket:** `.scratch/ci-cd/issues/02-headless-ui-smoke.md` (Status: in-review)

## State

Done, with one flagged environment issue in qa's test cleanup (not fixed by me — see Gotchas). Ready for `qa verify`.

## What changed

Commits `3692df3` and `a4d44ab` on the branch above.

- `apps/ci-cd/dev-server.mjs`: plain `node:http` server (`createDevServer`, exported for reuse). Serves the repo root, maps `.mjs`/`.js` to `text/javascript`, sends `Cache-Control: no-store`, `npm run dev -- <port>` as CLI. Path-traversal guarded. `/favicon.ico` (exported as `FAVICON_PATH`) gets a 204, not a 404 — see Gotchas.
- `apps/ci-cd/smoke.mjs`: starts its own ephemeral `createDevServer()` instance, drives headless Chromium via `playwright` (`chromium.launch`, trying `channel: "chrome"` then `"msedge"` then the bundled browser), loads each `argv` page, and records the first error per kind (console error, page exception, failed request, failed response ≥400), ignoring `FAVICON_PATH`. `npm run smoke -- <page> [<page> ...]`, exit 0/1.
- `package.json`: added `"dev"`, `"smoke"` scripts and `"playwright": "1.63.0"` devDependency (exact pin, per the ticket's dependency decision).
- `package-lock.json`: new, committed. `npm install` runs no install/postinstall scripts.

## Decisions made

- CLI seams match what qa's handoff (`.scratch/ci-cd/handoffs/02-qa-specify.md`) proposed exactly: `npm run dev -- <port>`, `npm run smoke -- <page> ...`.
- Used the plain `playwright` package (not `@playwright/test`) since this project uses `node:test`, not Playwright's own runner.
- `/favicon.ico` → 204 in the dev server, because Chromium's automatic favicon request otherwise 404s and makes the smoke check false-fail a page with no favicon.

## Next step

`qa` verifies this branch, then `security` reviews the Playwright dependency (version pin, lockfile, install scripts — all clean per above) before a merge proposal. CI wiring is ci-cd/01's job, not this ticket's.

## Suggested skills

`organism-protocol`, `tdd` (if qa needs to add a regression test for the hang below).

## Gotchas

**`apps/ci-cd/dev-server.test.mjs` hangs `npm test` forever on Windows**, after both its own subtests already pass (`ok 1`, `ok 2`). Its `stopServer()` calls `child.kill()` on the process from `spawn("npm", ["run","dev","--",port], {shell:true})`; on Windows that only kills npm's outer `cmd.exe` wrapper, not the actual `node apps/ci-cd/dev-server.mjs <port>` underneath (npm re-spawns the script via its own shell layer; Windows doesn't cascade-kill descendants like POSIX process groups). The orphaned server keeps the test worker's inherited stdio pipes open, so that worker process never exits on its own. Verified via `Get-CimInstance Win32_Process` showing orphaned `node.exe`/`npm-cli.js` after both assertions reported `ok`. I did not edit the test file (genome rule). Full writeup and a suggested one-line fix (`taskkill /pid <pid> /t /f` on win32 instead of `child.kill()`) are in the ticket's `## Comments`. `smoke.test.mjs` is unaffected (its child process always exits on its own).
