# 166: Make the context step's secret-in-root fallback name the file, and fix the current offender

**Type:** bug

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Context supply at dispatch (ADR 0014). Retro 2026-10-06: `secret-in-root` hit 160, 145 and 147 back to back (9 jg rows in all), so no Start-here context reached any cell. Ticket 96 fixed this once and it came back. Nobody can see which file tripped it, so every recurrence costs a hunt.

## What to build

1. In `scripts/dispatch-context.mjs`, when a tracked file matches `hasSecret` (from `scripts/exposure.mjs`), record the matching repo-relative **path** in the `{"kind":"jg",...}` row and in the printed JSON line (e.g. a `secret_path` field). Never record or print the file's contents or the matched text.
2. Find the file(s) tripping it now on `main` and fix them the way 96 did: build fake-secret fixtures at runtime instead of committing them as literals. If one is a real secret, stop and report it; don't edit it.
3. Add a guard so this can't come back unnoticed, for example a test that runs the root secret scan over the tracked files and fails with the offending path.

Files: `scripts/dispatch-context.mjs`, its tests, whichever files currently trip the scan, and the new guard test.

## Acceptance criteria

- [ ] A `secret-in-root` fallback row and printed line include the repo-relative path of the first matching file, and never its contents (test)
- [ ] `node scripts/dispatch-context.mjs --ticket organism-infra/166-secret-in-root-names-path --refresh` on the fixed branch no longer returns `secret-in-root`
- [ ] A test fails, naming the path, when a tracked file would trip the root secret scan
- [ ] Existing dispatch-context and exposure tests still pass

## Comments
