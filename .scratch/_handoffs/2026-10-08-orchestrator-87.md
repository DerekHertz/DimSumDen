# Orchestrator handoff 87 (2026-10-08)

## State
- **In flight: organism-infra/167** (usage cache + 429 cooldown), user-approved, relay autonomy applies. Branch `feat/167-usage-429-backoff` at 7247e95 (not pushed). Relay so far: qa specify (dc1faa8, 13 tests) → developer Sonnet (dac92c8) → qa fix round `-2` (7247e95: the root secret scan flagged the token literal in the qa test; the classifier blocked the developer from editing it, so qa fixed its own test with user approval) → full suite 3010/3010 saved at `/tmp/167-tests.txt` → qa light verify on Haiku: pass → risk-check 3 hits (shell-out and secrets in usage-cache.test.mjs, lock code in usage-claude.mjs) → **security running in the background** (handoff `167-security.md`).
- The developer's edit to `usage-keychain.test.mjs` (EXPECTED gains `source:"live"`, `age_s:0`) is in scope: criterion 3 requires it.
- The statusline kept its own 60 s cache, which sits on top of the shared cache (allowed by the ticket's "or defer").
- Worktrees: the qa specify, developer and qa-fix worktrees are detached and clean; gc them after merge. The verify worktree was removed.
- **New ticket organism-infra/209** (den v1 progress bar: statusline segment + band mod), P1, pushed. The user settled every choice in a grilling (see its Comments). Blocked by 167 only because both edit statusline.mjs.
- **Incident:** I built the frontier from batch-groups' Singles list and missed P1 143, listed under "unknown files". Read priorities for every frontier ticket.
- Usage API returned 429 at 2 of 6 checks; the last good reading was 5-hour 60%, weekly 78%.
- Not done yet: the jev advisory-outcome row for 167 (orchestrator pick qa-specify, Jev pick qa-specify, dispatched qa-specify, bounced false unless security bounces).

## Next
1. When security returns: on pass, push the branch, open the PR, wait for `gh pr checks --watch`, merge on green, run `npm run board -- resolve organism-infra/167-usage-429-backoff --pr <n>`, log advisory-outcome, then worktree-gc (dry run; the user's standing rule is to apply when only merged, clean worktrees are listed). On a bounce: a developer fix round.
2. Then a fresh session (`npm run next-session`): **209 first** (the user said "do it now"), then 143 → 106 → 107 → den-v1/10, 11 (the critical path to den v1), then den-v1/09.
