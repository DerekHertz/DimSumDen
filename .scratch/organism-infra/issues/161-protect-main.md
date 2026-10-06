# 161: Protect main

**Type:** ci

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** resolved

**Serves:** 158 security finding (medium): the repo is public and `main` is unprotected (branch-protection API 404). User ask, 2026-10-06: "let's get the main branch protected too".

## What to build

Turn on branch protection (or a ruleset) for `main` on DerekHertz/DimSumDen, owned by `security`:
- Require a pull request before merging, with the CI checks `test` and `security` required and passing. Zero required approvals (single maintainer; relay autonomy merges on green).
- Block force pushes and branch deletion.
- Admin bypass stays on (user, 2026-10-06), so the orchestrator's board-only pushes (organism-infra/158) keep working under the user's credentials. organism-infra/159 adds the pre-push gitleaks check for that path.
- Record the settings and how to verify them (`gh api repos/DerekHertz/DimSumDen/branches/main/protection` or the rulesets endpoint) in `docs/agents/` where security keeps CI notes.

Changing branch protection is a gate: security prepares the exact `gh api` command and the user runs it or approves it.

## Acceptance criteria

- [ ] `gh api` shows `main` protected: PR required, `test` and `security` checks required, force push and deletion blocked, admins not enforced
- [ ] A direct push of a non-admin or a PR with a red check cannot merge (verified by reading the API output, not by a live test push)
- [ ] The settings and verify command are documented

## Comments

- **orchestrator, 2026-10-06:** Filed on the user's ask; shape chosen: PRs + green CI, admin bypass (user, 2026-10-06).
- **security, 2026-10-06:** Security pass: docs-only branch, gitleaks clean, tests green. Protection NOT applied (gate): user runs the gh api command in handoffs/161-protect-main-security.md. Residual (low): admin bypass allows owner direct and force push, as the ticket intends.
- **security, 2026-10-06:** Docs committed; waiting on the user to run the branch-protection gh api command (gate)
