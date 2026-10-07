# 113: After a merge: sync main and dry-run worktree-gc

**Type:** feature

**Priority:** P2

**Blocked by:** 109, 110, 111

**Status:** parked

## What to build

After every merge the user asks for the same follow-up: "merge and switch to main" and "remove the dirty and unmerged worktrees" (42fefd50), "cleanup the old worktrees" (038a3fcb). On 2026-10-02 there were 23 worktrees and 93 stale local branches. Add `scripts/post-merge.mjs` for a `PostToolUse` hook matching `gh pr merge`: `git fetch` + `git pull --ff-only origin main` in the main checkout (stop and report on anything but a fast-forward), then `scripts/worktree-gc.mjs` dry run, and print its summary (under ~300 tokens). Extend `worktree-gc` to also list local branches whose commits are already in `origin/main` or a remote branch. Applying stays with the user (memory rule: auto-apply only when every entry is removable).

Files: `scripts/post-merge.mjs` (+ test), `scripts/worktree-gc.mjs`; gated: `.claude/settings.json`.

## Acceptance criteria

- [ ] Fires only after a successful `gh pr merge`
- [ ] Fast-forwards main or reports why it couldn't; never resets, stashes or forces
- [ ] Prints the gc dry run including stale branches
- [ ] Settings patch in `.scratch/_handoffs/gated/`
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Audit proposal 5, user "sure".
- **orchestrator, 2026-10-06:** Parked: User 2026-10-05: no Serves line naming a den-v1 step (refocus guardrail, ADR 0019 decision 8); park until v1 works.
