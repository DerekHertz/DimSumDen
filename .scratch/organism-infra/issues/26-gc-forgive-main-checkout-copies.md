# 26: worktree-gc forgives copies of uncommitted main-checkout files

**Type:** task

**What to build:** worktree-gc (ticket 16) forgives an untracked file only if main's committed tree has a byte-identical file at that path. Cells write handoffs to the main checkout without committing them, so a worktree's leftover handoff copy blocks cleanup. After PR #25 merged, 2 of 4 worktrees stayed dirty for this reason alone.

1. Also forgive an untracked file that is byte-identical to the same path on disk in the main checkout.
2. Silence the `fatal: path ... does not exist` stderr from `git show` when a path is missing from main; treat it as "not identical".
3. Optional: make the diff-summary text correct for staged tracked files and binary files (qa/security follow-ons from 16).

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] gc removes a merged worktree whose only dirty file matches an uncommitted file in the main checkout (test)
- [ ] gc still keeps a worktree whose untracked file differs from the main checkout's copy (test)
- [ ] a dry run prints no git `fatal:` lines for missing paths (test)

## Comments

- **Created (orchestrator, 2026-09-28):** at the user's request, after the post-merge gc run for 16.
- **qa, 2026-09-28:** QA pass (light verify, 85bca1f): 240/240 tests, specify tests unchanged, criteria 1-3 covered. See handoffs/26-qa-verify.md.
- **security, 2026-09-28:** Security pass. No critical/high. Low: worktree-gc.mjs:126 symlink follow (compare-only, no disclosure); worktree-gc.mjs:90 porcelain escapes undecoded (pre-existing, fails safe). execFileSync argv only, all catches keep worktree. Detail: handoffs/26-security.md
- **Resolved (orchestrator, 2026-09-28):** Merged as PR #28. Optional item 3 (diff-summary for staged/binary) not done; follow-on if wanted.
