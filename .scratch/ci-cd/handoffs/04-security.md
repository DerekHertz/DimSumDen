# Handoff: ci-cd/04 smoke fails loudly without deps — security review

**From:** security
**Branch:** `claude/ci-cd-04-tests`
**Commit reviewed:** `df3394d` (qa's round-2 addition, on top of developer's `36a812e`, on top of
qa's `6a14676`, based on `main`)
**Ticket:** `.scratch/ci-cd/issues/04-smoke-fail-loudly-without-deps.md`

## Verdict: Security pass

## Scope reviewed

Diffed `df3394d` against `origin/main`. Two files changed, no others:
- `apps/ci-cd/smoke.mjs` (+37/-4)
- `apps/ci-cd/smoke.test.mjs` (+237)

No `package.json`, lockfile, or `.github/workflows/` changes — no new dependency to gate, no CI
pipeline change in this branch's scope.

## Analysis

- `loadChromium()` dynamically imports the literal string `"playwright"` (no user/agent input
  reaches the import specifier) and classifies `ERR_MODULE_NOT_FOUND` into a fixed, static
  message. No injection surface.
- `launchBrowser()`'s new branch matches Playwright's own error text via regex
  (`/executable doesn't exist/i`) purely to pick a message; it doesn't execute or interpolate
  that text anywhere.
- All new `spawn()` calls in the test file (`smoke.test.mjs`) pass argument arrays, not a shell
  string, and don't set `shell: true` — no shell-injection surface, including the Windows
  `taskkill` fallback (`String(child.pid)` is a PID, not attacker-controlled text).
- Temp-directory helpers use `fs.mkdtempSync(os.tmpdir(), ...)` with a fixed prefix; no
  user-controlled path segments, so no path-traversal surface.
- This script (`apps/ci-cd/smoke.mjs`) is a local/CI dev-tooling smoke check, not the daemon —
  no network-bind or localhost-exposure concerns apply here.
- Secret scan: grepped the full branch diff (`origin/main..df3394d`) for key/token/credential
  patterns and reviewed all 3 commits (`6a14676`, `36a812e`, `df3394d`) — nothing found.

## Comments (non-blocking, already on the board)

Both were already flagged by the developer's post-handoff comment and qa; restating as security's
sign-off note, low severity, not blocking:

- `apps/ci-cd/smoke.mjs:30` (low) — `loadChromium()` maps *any* `ERR_MODULE_NOT_FOUND` thrown
  during `import("playwright")` to the generic "playwright not installed" message. An unrelated
  resolution failure inside one of playwright's own transitive deps would be misreported the same
  way. Not a vulnerability (fails closed, non-zero exit either way), just a misleading message in
  a rare case.
- `apps/ci-cd/smoke.mjs:122` (low) — the dependency check (`loadChromium()`) now runs after the
  args-usage check, so a bad invocation with no page args short-circuits before the dependency
  check. Untested, not exploitable, just an ordering nit worth a look if this file grows.

Neither affects AC1-3 or introduces a security risk; both are safe to leave for a future ticket.

## Environment issues

The `Write` tool refused a direct write to the main-checkout handoff path
(`C:\claude_sessions\agent_office\.scratch\ci-cd\handoffs\04-security.md`), citing worktree
isolation. Wrote it here instead and copied it over with a single `cp` command per the
organism-protocol's sanctioned handoff exception.
