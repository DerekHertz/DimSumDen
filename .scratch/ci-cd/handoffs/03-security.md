# 03: security handoff

**Ticket:** `.scratch/ci-cd/issues/03-smoke-module-not-found-and-missing-checks.md`
**Branch:** `claude/ci-cd-03-smoke-and-checks` (worktree `agent-a01910f670cd98b91`, off fresh `origin/main` `a5100bb`)
**Status set:** `ready-for-human` (brain gate: workflow + branch-protection changes need a yes before I write them)

## Diagnosis

Both symptoms trace to the same root cause: **ticket `ci-cd/01` (build the CI pipeline) was never implemented.** `.github/workflows/` does not exist anywhere in this repo's git history (`git log --all -- .github/workflows` is empty), and `.scratch/ci-cd/issues/01-ci-pipeline.md` is still `Status: ready-for-agent`.

### 1. `ERR_MODULE_NOT_FOUND` in `apps/ci-cd/smoke.test.mjs`

Not a code bug. `apps/ci-cd/smoke.mjs:9` does `import { chromium } from "playwright"`, and `playwright@1.63.0` is correctly declared in `package.json` and committed in `package-lock.json` (added in `3692df3`, ci-cd/02). `node_modules/` is correctly gitignored. The error fires whenever `npm install`/`npm ci` hasn't been run in a given checkout -- which is every fresh worktree today, since nothing automates that step.

Verified the fix is just installing: on a fresh worktree off `main` (`a5100bb`),
```
npm install   # added 2 packages (playwright, playwright-core), 0 vulnerabilities
npm test      # 96/96 pass, smoke.test.mjs included
```
No commit needed for this half. It will keep recurring on every fresh clone/worktree until something runs `npm ci` automatically before tests -- which is exactly what a CI workflow does.

### 2. PR #17 (`claude/organism-infra-05-tests`) reports no checks

`gh pr checks 17` -> `no checks reported`. Confirmed: there is no `.github/workflows/*.yml` in the repo at all, on any branch, ever. Nothing can report a check because nothing runs. This isn't specific to PR #17 or its branch -- no PR in this repo has ever had a check.

### Branch protection

`gh api repos/DerekHertz/agent-office/branches/main/protection` -> `403: Upgrade to GitHub Pro or make this repository public to enable this feature.` Classic branch protection is unavailable on this repo's current plan/visibility. (GitHub's repo-rulesets feature may or may not be gated the same way on a free private repo -- I did not test it further; worth the user checking in the GitHub UI before assuming a workaround exists.)

## Proposal (not applied -- needs a yes)

Per ticket instruction ("propose any workflow or branch-protection change before you make it; stop and report it"), I did not create any workflow file or touch repo settings. Proposing here, matching `ci-cd/01`'s existing spec:

**`.github/workflows/ci.yml`** -- runs on `pull_request` to `main` and `push` to `main`:
- top-level `permissions: contents: read`
- `actions/checkout` and `actions/setup-node` pinned to a commit SHA (version in a trailing comment)
- Node 22 (matches local dev: `node --version` -> `v22.20.0`; no `engines`/`.nvmrc` in the repo today, worth adding separately)
- **test job (qa's stage):** `npm ci`, then `npx playwright install --with-deps chromium` (smoke.mjs falls back to the Playwright-managed Chromium when no system Chrome/Edge is present, per ci-cd/02's design), then `npm test`; fails the run on any failing or skipped test
- **security job (mine):** secret scan via a pinned-SHA gitleaks action over the PR's commits; `npm audit --audit-level=high` (lockfile exists now, so this actually runs, not just logs a skip) -- confirmed clean today, 0 vulnerabilities
- no `pull_request_target`, no secrets exposed to forked-PR runs

**Branch protection proposal** (blocked on the plan/visibility limitation above -- the user decides whether to upgrade, make the repo public, or accept no enforced protection for now):
- required checks: test, security (secret scan + audit)
- required PR review before merge
- no force-push, no direct push to `main`

## Next step

If the user approves: I (or whoever's dispatched) write `.github/workflows/ci.yml` on this branch, run a deliberately-failing test on a throwaway branch to confirm it goes red (per ci-cd/01's criterion), record the run URL, then push and open a PR. Branch-protection is a separate apply-or-not decision for the user in the GitHub UI, gated on the plan/visibility question above.

If the user wants this deferred back to `ci-cd/01`'s own full relay (qa specify -> developer -> qa verify -> security) instead of building it inside `ci-cd/03`, that's also fine -- either way nothing is blocking on my end beyond this decision.

## Environment issues

- `gitleaks` isn't installed in this environment; not needed for diagnosis (no code diff to scan), but note it for whoever builds the security stage -- no local dry run possible here, only via the pinned Action in CI.
