# 97: Context step: jg hits resource_limit on the full repo root

**Type:** bug

**Priority:** P1

**Blocked by:** organism-infra/96-test-fixture-fake-keys-at-runtime

**Status:** resolved

## What to build

With 95 and 96 in, `scripts/dispatch-context.mjs` passes its size gate and secret scan, but `jg` on the full repo root prints "discovery incomplete" with `resource_limit: 1` and exits non-zero, so every run falls back `jg-exit-1` and no cell gets start-here context. `jg` on the `scripts/` subtree succeeds, and `jg doctor` is fine. Find the limit (jg docs or flags) and make the context step stay inside it, for example by pointing jg at the ticket's `Files:` paths or their subtrees, or by passing a supported limit flag. Keep the existing secret scan and the fallback contract unchanged.

## Acceptance criteria

- [ ] Run against this repo, `node scripts/dispatch-context.mjs --ticket <a code ticket>` returns a non-null `path` with no `fallback` (recorded in the handoff)
- [ ] When jg still fails, the run falls back exactly as before (exit 0, a named fallback) (test)
- [ ] Secret scan and size gate behaviour unchanged (existing tests stay green)

## Comments
- **orchestrator, 2026-10-02:** Split from 96 AC4 (user decision). Found by the 96 developer.
- **orchestrator, 2026-10-02:** batch K = organism-infra/97-jg-resource-limit-full-root + organism-infra/91-wind-down-at-90 (both in scripts/). One relay, one branch, one PR (user approved 2026-10-02).
- **developer, 2026-10-02:** cause is a >16 MiB file plus jg 0.4.4 lacking --exclude, not root size; qa's [97] fix tests do not fit; see 97-developer.md
- **orchestrator, 2026-10-02:** Developer found the real cause (see 97-developer.md): installed jg 0.4.4 rejects --exclude (wrapper needs 0.6+), jg refuses files over 16 MiB (design/3d/panda-mascot.blend, 97 MB), and output is 91 KB. User decisions: (1) environment fix: the user runs `npm install -g @dzhng/jevgrep@latest` (0.8.0); the developer stage waits until `jg --version` reports 0.8.x. (2) Scope approved: per-call excludes for files over 16 MiB, `--max-output-bytes` added to the jg.mjs allowlist, version check wired in. qa re-specifies the 4 [97] fix tests first. Allowlist change means full security. (3) 91 stays in batch K and ships with 97.
- **orchestrator, 2026-10-02:** Environment fix done: user upgraded jg; `jg --version` reports 0.8.0. The developer stage can run once qa re-specify returns.
- **qa, 2026-10-02:** qa specify round 2: 11 red tests committed at 20afbaf on feat/jg-limit-batchK
- **qa, 2026-10-02:** QA pass at 97275b0: npm test 1729/1729, qa tests unchanged, countFiles change sound; see 97-qa-verify.md
- **security, 2026-10-02:** Security pass at 97275b0. No critical/high. Low: scripts/jg.mjs:43 allowlist accepts --max-output-bytes 0 (jg: unlimited; callers pass a constant, cap re-checked at dispatch-context.mjs:143). Low: jg.mjs:54 control-char/'..' name on a >16 MiB file refuses the call, falls back refused-exclude (fails closed). Low: dispatch-context.mjs:149 statSync follows symlinks (harmless). Excludes validated, anchored, escaped, probed against gitignore semantics; gitleaks clean, npm audit 0, no dep/CI change. Details: handoffs/97-security.md.
