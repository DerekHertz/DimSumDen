# 03: Fix the smoke test's ERR_MODULE_NOT_FOUND, and find out why PR #17 has no CI checks

**Type:** task

**What to build:** `apps/ci-cd/smoke.test.mjs` fails on `main` with `ERR_MODULE_NOT_FOUND` (from `node:internal/modules/package_json_reader`), independent of any branch. Separately, `gh pr checks 17` reports no checks on `claude/organism-infra-05-tests`. Find the cause of each, then fix it or report it.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `npm test` is green on `main`, including the ci-cd smoke test
- [ ] CI runs on PRs (PR #17 shows checks), or the reason it doesn't is documented and approved by the user
- [ ] Any branch-protection or workflow change is proposed to the user first

## Comments

- **Created (orchestrator, 2026-09-27):** Found in the organism-infra/05 developer handoff. The user chose to route it to `security`. PR #17's merge waits on this.
- **security, 2026-09-28:** Security diagnosis: one root cause for both. (1) ERR_MODULE_NOT_FOUND is not a code bug: smoke.mjs correctly imports playwright, which is pinned in package.json and committed in package-lock.json. The error only appears when npm install has not been run (node_modules is gitignored, as expected). Confirmed on main a5100bb: npm install then npm test = 96/96 pass, smoke included. (2) PR 17 has no checks because ticket ci-cd/01 (build .github/workflows/ci.yml) was never implemented -- git history has zero commits touching .github/workflows, and ticket 01 is still Status ready-for-agent. No workflow file exists in this repo, so nothing can report a check on any PR. A CI workflow running npm ci before npm test would resolve both symptoms. Per this ticket instruction I have not written the workflow file or touched branch protection; full proposed workflow content is in the handoff for the user to approve. Also found: this repo cannot use classic branch protection on its current plan or visibility, gh api branches main protection returned 403 Upgrade to GitHub Pro or make this repository public. npm audit at audit level high: 0 vulnerabilities today.
- **security, 2026-09-28:** Diagnosis done, both symptoms root-caused to ci-cd/01 (CI pipeline) never being built. Proposed workflow + branch-protection change written to handoff; needs the user's yes before I write .github/workflows/ci.yml or touch repo settings.
- **unknown, 2026-09-28:** Orchestrator, 2026-09-28: PR #18's first CI run (36376905451) hung. The test job sat in 'Run tests' for 36+ min, probably the Playwright smoke test not exiting. The security job failed at the Gitleaks step. The user asked to stop hangs, so the run is canceled and the security cell stopped. Next fix round: add timeout-minutes to both jobs, find what the smoke test hangs on, and check the gitleaks finding.
- **unknown, 2026-09-28:** security, 2026-09-28: Security pass. Fix round 2 pushed (d2bc58d, PR #18): timeout-minutes 15/5 added; hang root-caused to dev-server.test.mjs/dev-server-bind.test.mjs's stopServer() only killing the shell wrapper on POSIX (child.kill()), orphaning npm's real node server, which kept stdio pipes open and hung node --test forever -- fixed by spawning detached and signaling the process group; same fix applied to smoke.test.mjs's timeout path. Gitleaks 403 was not a leaked secret: gitleaks-action's PR-commits API call needed pull-requests: read, which the security job's permissions block lacked -- added it. New CI run 36380401057: both jobs green (security 17s, test 1m8s). Manual pattern scan of the branch diff found no secrets. Handoff: .scratch/ci-cd/handoffs/03-security-2.md
- **unknown, 2026-09-28:** Merged as PR #18 (d257764) with the user's approval. CI is green. Branch protection is skipped for now: it needs GitHub Pro or a public repo.
