# 80: jg board guard, then opt-in jg for scout

**Type:** feature

**Priority:** P1

**What to build:** Apply 67's required jg control (`handoffs/67-security.md`), then let `scout` use jg as an opt-in search.

1. A jg wrapper (e.g. `scripts/jg.mjs`) that always passes `--exclude` for `.scratch/` and `.claude/`, refuses a root inside `.scratch` or `.claude`, and refuses `--hidden`, `--no-ignore`, `--include-sensitive` and `--include-dependencies`. It runs the query through `exposure.mjs` `hasSecret` before sending.
2. A `scripts/hooks/bash-guard.mjs` rule that blocks direct `jg` calls outside the wrapper.
3. A genome line telling `scout` it may use the wrapper, falling back to `rg` when the wrapper fails or returns nothing useful. It's a `.claude/` edit, so the developer writes it into the handoff and the user applies it.
4. Log one row per jg call (query length, files returned, whether scout fell back, ms) so we can judge whether it saves tokens.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] Wrapper excludes `.scratch/` and `.claude/` and refuses each listed flag and root (tests)
- [ ] `bash-guard` blocks a raw `jg` call and allows the wrapper (tests)
- [ ] A query containing a secret is refused before sending (test)
- [ ] Each call logs a row; a jg failure exits cleanly so scout falls back (tests)
- [ ] Scout genome line written for the user to apply

## Comments

- **Created (orchestrator, 2026-09-30):** User chose jg live testing for scout after 67's guard is applied.
- **developer, 2026-09-30:** developer done: 43881f1 on dev/80-jg-guard-and-scout-opt-in; qa's 21 tests pass, npm test 1051/1051; risk-check hit, security needed. Scout genome line for the user is in handoffs/80-developer.md.
- **qa, 2026-09-30:** QA pass: 1051/1051 pass, 0 fail, 0 skipped. Specify tests unchanged (empty diff cacf054→43881f1). All 21 criteria covered; AC5 human-verified with concrete genome line. Developer tests add 11 edge-case tests, no weakening. Five changed files all in scope. Next: security.
- **security, 2026-09-30:** Security pass. gitleaks clean (2 commits). npm audit 0 vulns. Spawn: no shell injection (array argv, no shell:true). Usage row: queryLen only, no query text. All 67 controls verified. Two Lows: (1) scripts/jg.mjs:57-61 checkout boundary skipped if checkout param omitted and no .git ancestor — CLI always sets it, non-blocking. (2) scripts/hooks/bash-guard.mjs:9 guard bypassable by shell indirection — documented residual, inert until ticket 52, non-blocking. Scout genome line approved for user to apply.
