# 161 orchestrator: resolved

Docs merged in PR #166 (a6dfc12). User applied the protection with the documented `gh api -X PUT` command (2026-10-06). Verify output matched: checks `test` + `security` (app 15368), strict false, approvals 0, admins false, force_push false, deletions false. All three acceptance criteria met.

```json
{
  "ticket": "organism-infra/161-protect-main",
  "cell": "orchestrator",
  "current_step": "Resolved: protection applied by user and verified via gh api; docs merged in PR #166.",
  "artifacts": ["docs/agents/branch-protection.md", "docs/agents/branch-protection-main.json", "PR #166"],
  "decisions": ["Classic branch protection, admins not enforced (security, user-approved shape)"],
  "failures": [],
  "pending": []
}
```
