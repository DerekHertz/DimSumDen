# 96: Build fake-secret test fixtures at runtime so the context step's secret scan passes

**Type:** bug

**Priority:** P1

**Blocked by:** organism-infra/95-context-size-gate-counts-binaries

**Status:** resolved

## What to build

After batch J (92+95), `scripts/dispatch-context.mjs` no longer skips on size, but its root secret scan (`hasSecret`) hits fake-secret literals in six test files, so every run falls back with `secret-in-root` and no cell gets start-here context. Rewrite those fixtures so the literal key text never appears in the source: assemble each fake key at runtime (e.g. string concatenation or `repeat`), keeping every test's behaviour and assertions unchanged. Do not change the secret scan itself.

Files: `scripts/jev-advisory-cli.test.mjs`, `scripts/jev-advisory.test.mjs`, `scripts/jev-hardening.test.mjs`, `scripts/jev-wake-prelude.test.mjs`, `scripts/risk-check.test.mjs`, `scripts/usage-provider.test.mjs`.

## Acceptance criteria

- [ ] None of the six files trips `hasSecret` from `scripts/dispatch-context.mjs` (test that scans them)
- [ ] Every existing test in the six files still passes with unchanged assertions; `npm test` green
- [ ] The secret scan code is unchanged (diff touches only the six test files and the new test)
- [ ] Run against this repo, `node scripts/dispatch-context.mjs --ticket <a code ticket>` returns a non-null `path` with no `fallback` (recorded in the handoff)

## Comments
- **orchestrator, 2026-10-02:** Found by the batch J developer and qa verify. User chose "build the fake keys at runtime" over excluding `*.test.mjs` or an allowlist (2026-10-02).
- **orchestrator, 2026-10-02:** User decision: ship 96 on AC1–AC3. AC4 (non-null path) moved to organism-infra/97: jg hits resource_limit on the full root (env issue, 2026-10-02).
- **qa, 2026-10-02:** QA pass at 1d77c40: AC1 scripts/test-fixture-secrets.test.mjs (6 tests); AC2 npm test 1663 pass, 0 fail, 0 skipped, one-line fixture diffs only; AC3 diff touches only six test files plus new test. AC4 moved to 97.
- **security, 2026-10-02:** Security pass at 1d77c40: no findings. Fake keys split at runtime, gitleaks clean, scan code and deps untouched.
