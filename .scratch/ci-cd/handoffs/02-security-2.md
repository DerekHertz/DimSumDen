# Ticket: .scratch/ci-cd/issues/02-headless-ui-smoke.md
# Cell: security (re-review after bounce)
# Date: 2026-09-27

## Scope
Re-review of `git diff f13b165..8797ce6` on `claude/ci-cd-02-headless-ui-smoke` only
(2 files: `apps/ci-cd/dev-server.mjs`, new `apps/ci-cd/dev-server-bind.test.mjs`).
Everything else on the branch already passed a prior full security review; not
re-reviewed here.

## Verdict
**Security pass.**

- `apps/ci-cd/dev-server.mjs:88`: `server.listen(port, "127.0.0.1", ...)` confirmed --
  the prior high-severity all-interfaces bind is fixed.
- `apps/ci-cd/dev-server-bind.test.mjs`: sound. Spawns the real `npm run dev` on an
  OS-assigned free port, confirms 127.0.0.1 answers 200, and (when a LAN IPv4 address
  is present) confirms a raw TCP connect to that address on the same port is refused --
  a direct behavioral proof of the fix, not just a config read. Cleanup: `stopServer()`
  uses `taskkill /pid <pid> /t /f` on win32 (whole process tree, since npm re-spawns
  node through its own shell layer there) and `child.kill()` elsewhere, in a `finally`
  block so it runs on assertion failure too. No orphaned-process risk found. Port arg
  is a number from `findFreePort()`, not external input, so no injection surface.
- No new dependencies, no secrets in the diff.

## Next
Orchestrator: ready for merge proposal.

## Unresolved / environment issues
None.
