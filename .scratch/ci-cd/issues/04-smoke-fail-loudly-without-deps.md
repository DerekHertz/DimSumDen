# 04: The smoke test names the real cause when Playwright isn't installed

**Type:** task

**What to build:** When `playwright` or its Chromium binary is missing, `apps/ci-cd/smoke.test.mjs` fails fast with one clear line, for example `smoke: playwright not installed, run npm install && npx playwright install chromium`, instead of a raw `ERR_MODULE_NOT_FOUND` stack.

Fresh agent worktrees never have `node_modules`. Cells called this failure "pre-existing, unrelated" 3+ times on 2026-09-28 without naming the cause (see the `incident` line in `.scratch/usage.jsonl`).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] With Playwright missing, the smoke test fails with the one-line message above and no stack trace
- [ ] With Playwright installed, behavior is unchanged: CI is green and the smoke test passes in the main checkout
- [ ] It doesn't silently skip: a missing dependency still counts as a failure, so CI can't go green without it

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request. The user also approved `npm ci` and `npx playwright install chromium` in the main checkout. After those ran, the smoke test passes 2/2 there.
- **qa, 2026-09-28:** qa specify done. Branch claude/ci-cd-04-tests, commit 6a14676. 2 new tests in apps/ci-cd/smoke.test.mjs covering AC1 (one-line message, no stack) and AC3 (never skips); AC2 covered by existing tests. Handoff: .scratch/ci-cd/handoffs/04-qa-specify.md
- **qa, 2026-09-28:** qa specify complete; failing tests on claude/ci-cd-04-tests, ready for developer
- **developer, 2026-09-28:** developer: fix on claude/ci-cd-04-tests commit 36a812e, all 4 tests pass. Handoff: .scratch/ci-cd/handoffs/04-developer.md
- **unknown, 2026-09-28:** developer: post-handoff spec review (ran after release) flagged for qa: (1) no test exercises the missing-Chromium-binary branch, only missing-playwright-package; (2) loadChromium() maps any ERR_MODULE_NOT_FOUND to the generic playwright-missing message, so an unrelated resolution failure inside playwright's own deps would be misreported the same way; (3) moving the dependency check into main() after the usage-check means a bad invocation with no page args now short-circuits before the dependency check runs, untested. None block AC1-3 as written (all 4 tests pass), but worth a look before security sign-off.
- **unknown, 2026-09-28:** qa verify (full, commit 36a812e): QA bounce. 7/7 tests pass, no test weakening (smoke.test.mjs diff vs qa's 6a14676 is empty). Spec gap: AC1 covers 'playwright OR its Chromium binary' missing, but smoke.test.mjs only exercises the missing-package branch (makeWorktreeWithoutDeps, no node_modules at all); launchBrowser's missing-Chromium-binary classification (the 'Executable doesn't exist' regex path) has zero test coverage and isn't human-verified -- same gap the developer's own post-handoff comment already flagged. Bouncing for a test covering that branch. Handoff: .scratch/ci-cd/handoffs/04-qa-verify.md
- **unknown, 2026-09-28:** qa verify (full, round 2, commit df3394d): QA pass. Added the missing test for launchBrowser's Chromium-binary-missing branch (stubbed the playwright package in a fresh temp dir with a fake chromium.launch that throws Playwright's own 'Executable doesn't exist' message -- deterministic on any host, unlike PLAYWRIGHT_BROWSERS_PATH alone which system Chrome/Edge can mask). 8/8 tests pass; smoke.test.mjs diff vs qa's 6a14676 is additions only, no weakening. AC1-3 all covered by passing tests. Handoff: .scratch/ci-cd/handoffs/04-qa-verify-2.md
- **security, 2026-09-28:** security review (commit df3394d): Security pass. No secrets, no new/changed deps, no CI workflow changes. loadChromium()/launchBrowser() changes are static-string imports and regex-on-message classification only, no injection surface; test spawn() calls use arg arrays (no shell). Low-severity, non-blocking notes (already flagged by qa/developer): generic ERR_MODULE_NOT_FOUND mapping in smoke.mjs:30, and dependency-check-after-usage-check ordering in smoke.mjs:122. Handoff: .scratch/ci-cd/handoffs/04-security.md
- **security, 2026-09-28:** security pass, ready for orchestrator merge proposal
- **Resolved (orchestrator, 2026-09-28):** Merged in PR #22 (b0c20a3). Worktrees cleaned.
