# 166: Make the context step's secret-in-root fallback name the file, and fix the current offender

**Type:** bug

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** resolved

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
- **orchestrator, 2026-10-06:** qa light verify bounced on full-suite failures only (46, then 74, mostly Playwright and smoke timeouts) while other full suites ran in parallel. The ticket's own tests pass. User decision 2026-10-06: an environment issue, not a bounce, so it does not count toward fails-twice. Once batch C's suite run ends, a scout reruns the full suite on feat/166 with nothing else running. Green: continue to risk-check. Red: back to a developer. Suite-lock ticket filed.
- **orchestrator, 2026-10-06:** Full-suite rerun alone on caa893f: 2185 pass, 0 fail, 0 skipped (scout). The qa verify failures were environmental, so light verify's other findings stand as a pass. Next: risk-check.
- **security, 2026-10-06:** Security pass. gitleaks clean; no critical/high/medium. Low: dispatch-context.mjs:115 echoes tracked path by design; root-secret-scan.test.mjs duplicates the file-set filter (drift risk). Details in handoff 166-security.md.
