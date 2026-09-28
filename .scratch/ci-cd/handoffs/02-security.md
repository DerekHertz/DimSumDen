# Ticket 02 — security review handoff

**Branch reviewed:** `claude/ci-cd-02-headless-ui-smoke` (worktree `ci-cd-02-dev`, commit `f13b165`, base `eea046a`)

**Verdict: Security bounce.** Full detail in the ticket's `## Comments`.

## The blocker
`apps/ci-cd/dev-server.mjs:88`, inside `main()`: `server.listen(port, ...)` — no host argument, so Node binds all interfaces (`0.0.0.0` and `[::]`), not localhost only. Confirmed empirically by running the server directly (`node apps/ci-cd/dev-server.mjs <port>`) and checking `netstat -ano`: both `0.0.0.0:<port>` and `[::]:<port>` showed LISTENING. `npm run dev` therefore exposes the whole repo tree to the LAN with no auth.

Fix is one line: `server.listen(port, "127.0.0.1", ...)`. The library function `createDevServer()` itself is fine — only the CLI entry point in `main()` needs the host pinned. `smoke.mjs`'s own ephemeral server (`dev-server.mjs:34`) already does this correctly (`listen(0, "127.0.0.1", ...)`), so it's a good reference for the fix.

## Everything else passed
- Path traversal in `dev-server.mjs` (`path.normalize` + `startsWith(root)` check): sound.
- `smoke.mjs` browser launch flags: no risky flags (no `--no-sandbox`, no disabled web security).
- `playwright@1.63.0` devDependency: exact pin, lockfile committed with integrity hashes, no install/postinstall scripts (verified in `node_modules/{playwright,playwright-core}/package.json`), `npm audit --package-lock-only` clean (0 vulns), legitimate package/no typosquat.
- Secret scan of the branch diff: nothing found (gitleaks not installed; pattern grep only).
- CI wiring is correctly out of scope (blocked on ci-cd/01).

## Process hygiene
Started `node apps/ci-cd/dev-server.mjs 18173` directly (no shell wrapper) to observe its bind address; killed it by its actual Windows PID (`taskkill /PID 13192 /F`) once confirmed. Verified via `netstat -ano` that the port was free afterward. No lock file existed for this ticket at review time, so none was claimed or released.

## Next step
Developer applies the one-line host fix, then back to security (or straight to qa/merge-proposal per whatever the orchestrator's relay order calls for) to confirm the bind and re-pass.
