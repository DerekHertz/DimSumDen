```json
{"ticket": "organism-infra/161-protect-main", "cell": "security", "current_step": "Protection payload and docs committed on security/161-protect-main (53a42a8). Protection is NOT applied: pass gate, user runs the gh api command.",
 "artifacts": ["docs/agents/branch-protection.md", "docs/agents/branch-protection-main.json"],
 "decisions": ["Classic branch protection, not a ruleset: the ticket's 'admins not enforced' is one field (enforce_admins:false); a ruleset adds a bypass-actor entry and nothing else here.", "Required checks pinned to GitHub Actions app id 15368 so no other app can satisfy them.", "strict:false (branch need not be up to date), to avoid a rebase and CI re-run on every concurrent relay PR.", "Zero required approvals, per the ticket."],
 "failures": [],
 "pending": [{"item": "User applies protection with the gh api command below, then runs the verify command; then merge PR for this docs branch", "owner": "user"}]}
```

## State

Done on the branch, awaiting the user's apply. No code changes; docs and one JSON payload only.

## What changed

Branch `security/161-protect-main`, commit 53a42a8 on base 891242b. Two files under `docs/agents/`: `branch-protection.md` (check names, settings, rationale, apply, verify, rollback) and `branch-protection-main.json` (the PUT payload).

Confirmed read-only before writing:
- `.github/workflows/ci.yml` job names are `test` and `security`.
- `gh pr checks 165` lists `security` and `test`, both pass. Check runs on e0575ba come from github-actions, app id 15368.
- `gh api .../branches/main/protection` returns 404 "Branch not protected"; `.../rulesets` returns `[]`. Repo is public, you hold admin.

## Command for the user (gate: run this yourself)

From the branch worktree, or any checkout containing the JSON file (so after this branch merges):

```
gh api -X PUT repos/DerekHertz/DimSumDen/branches/main/protection --input docs/agents/branch-protection-main.json
```

Verify (maps to the three acceptance criteria):

```
gh api repos/DerekHertz/DimSumDen/branches/main/protection --jq '{checks: .required_status_checks.checks, strict: .required_status_checks.strict, approvals: .required_pull_request_reviews.required_approving_review_count, admins: .enforce_admins.enabled, force_push: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled}'
```

Expected: admins false, approvals 0, checks test and security (app 15368), force_push false, deletions false, strict false. Rollback: `gh api -X DELETE repos/DerekHertz/DimSumDen/branches/main/protection`.

## Review of this branch

Security pass on the branch diff (docs and JSON only). gitleaks on origin/main..53a42a8: no leaks. `npm test`: 2023 pass, 0 fail.

Residual risk (low, not blocking): admin bypass means the owner's credentials can push directly to `main` and force push. Intended per the ticket; 159 adds the pre-push gitleaks check. Keep the token scope narrow.

## Next step

User runs the apply command, then verify. Afterwards the orchestrator opens the PR for this branch and merges on green CI. Order note: applying before the merge means this docs PR needs the `test` and `security` checks green, which is the intended behavior.

## Suggested skills

None.

## Gotchas

- Renaming a CI job breaks the required check (merges hang waiting). The doc says to change workflow and settings together.
- After protection is on, the orchestrator's `.scratch/`-only pushes to `main` rely on admin bypass; if one is rejected, check that `enforce_admins` is still false.
