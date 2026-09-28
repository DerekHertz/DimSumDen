# 01: CI pipeline for pull requests and main

**Type:** task

**What to build:** A GitHub Actions workflow that runs on every pull request to `main` and on every push to `main`. It gates merges with a test stage, specified by `qa`, and a security stage, specified by `security`. It also includes a proposal for branch protection on `main`. `security` owns the workflow after this ticket lands.

Test stage (qa):
- `npm test` (node's built-in runner over `apps/**` and `packages/**` `*.test.mjs`, including the panda asset contract check) on the Node version the repo uses.
- Fails the run on any failing or skipped test.

Security stage (security):
- Secret scan of the PR's commits (e.g. gitleaks), with the action pinned to a commit SHA.
- `npm audit --audit-level=high` once a lockfile exists. Until then the step is present, and it logs that it was skipped.
- The workflow uses least-privilege `permissions:` (`contents: read` by default), no `pull_request_target`, and no secrets exposed to forked PRs.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `.github/workflows/ci.yml` runs the test and security stages on `pull_request` to `main` and `push` to `main`
- [ ] Every third-party action is pinned to a full commit SHA, with the version in a comment
- [ ] The workflow sets top-level `permissions: contents: read`, and no job widens it without a stated reason
- [ ] A deliberately failing test on a throwaway branch turns the run red (record the run URL in Comments, then delete the branch)
- [ ] A lint stage is left out until a linter is adopted. Adding one is a dependency, so it's a brain gate.
- [ ] Branch-protection proposal in Comments: required checks, required PR review, no force-push, no direct push to `main`. The user applies it (brain gate).
- [ ] Runs the full code relay: qa specify, developer, qa verify, security review

## Comments

- **Created (main session, 2026-09-26):** At the user's request. The pipeline is built by a developer ticket; qa defines the test stage and security the security stage. Afterwards, security owns `.github/workflows/` and branch protection, and the orchestrator watches for version-control drift at each sync.

- **Resolved (orchestrator, 2026-09-28):** Delivered by ci-cd/03 (PR #18).
