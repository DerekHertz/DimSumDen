# 05: Dispatch a cell onto an existing branch, and clean up worktrees

**Type:** task

**What to build:** A reliable way for the orchestrator to send a cell to continue, or review, an existing branch. That covers fix rounds, qa verify and security review. It also needs a worktree lifecycle so finished worktrees don't pile up.

Today:
- Subagent cells with `isolation: worktree` get a fresh worktree off `main`.
- The permission classifier denies checkout, merge and reset of another branch there ("Irreversible Local Destruction" / "Modify Shared Resources").
- The worktree guard blocks `cd` into the branch's own worktree.
- Ticket 07's round 4 failed this way. Rounds 2 and 3 got around it with `git reset --hard` or by running a generic agent without isolation.
- There are now 13 worktrees, several of them stale.

Options to weigh:
- The orchestrator creates the worktree from the target branch (`git worktree add <path> <branch>`) and the cell runs there.
- A `board dispatch` command in the `board` CLI (02).
- Review cells (qa verify, security, designer critique) run without isolation and are read-only on the branch's worktree.
- A permission rule that allows a clean-worktree reset.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] A fix round and a qa verify run can each start on an existing branch without denied git commands or `reset --hard`
- [ ] Review cells can run the branch's tests read-only
- [ ] Worktree lifecycle: which worktrees are kept, and when merged or abandoned ones are removed (removal asks the user first)
- [ ] Genome or protocol changes this needs are proposed to the user (brain gate)

## Comments

- **Created (orchestrator, 2026-09-27):** At the user's request, as part of making the organism loop efficient before more animation work. Evidence: ticket 07 Comments, and `handoffs/07-designer-2.md` env issue 5.
- **Scope approved (user, 2026-09-27):** (1) Orchestrator rule: before a dispatch, make sure the branch isn't checked out anywhere. Fix rounds `git checkout <branch>` in their own worktree; reviewers take a detached checkout of the exact SHA. (2) `scripts/worktree-gc.mjs`: removes clean agent worktrees whose HEAD is already on main, and reports dirty or locked ones; the orchestrator runs it after each merge. It goes through the full relay and gets full security, since it deletes files. (3) Tests with temporary repos.
- **Policy (user, 2026-09-27), goes into the orchestrator genome and `organism-protocol` in this ticket:** The orchestrator may merge PRs, but always asks the user first. **Only the orchestrator edits `.claude/`** (genomes, skills, settings), and it always asks permission first. Other cells propose `.claude/` changes in their handoff.
- **Also (user, 2026-09-27):** `usage-watch` wasn't run at dispatch points in this session: the last check was at 30%, and the next was at 82%, only when the user asked. Make it enforced, not voluntary. For example: an orchestrator loop step that runs it before every dispatch and on every return, or a hook. Propose the mechanism to the user.
- **qa, 2026-09-28:** QA specify: 9 failing tests in scripts/worktree-gc.test.mjs on branch claude/organism-infra-05-tests (commit 81161aa), covering the approved worktree-gc scope (remove clean+merged agent worktrees, report dirty/locked, never touch main checkout or non-.claude/worktrees paths). human-verified: the other 3 acceptance criteria (dispatch onto existing branch, review cells read-only, brain-gate proposal) are protocol/genome changes, not testable this way. Assumed CLI (node scripts/worktree-gc.mjs [--root <path>] [--apply]) is not yet user-confirmed; see .scratch/organism-infra/handoffs/05-qa-specify.md.
- **qa, 2026-09-28:** qa specify complete: failing tests written, developer up next
- **developer, 2026-09-28:** worktree-gc.mjs implemented, PR #17 opened
- **unknown, 2026-09-28:** QA verify (light, at PR #17 SHA 21bdf02): PASS. scripts/worktree-gc.test.mjs: 9/9 pass, node --test scripts/worktree-gc.test.mjs. Diffed scripts/worktree-gc.test.mjs (81161aa..21bdf02): no change -- none of the specify tests were deleted, weakened, or had assertions altered. git diff 81161aa..21bdf02 --stat: only scripts/worktree-gc.mjs changed (157 insertions), matching approved scope. Implementation matches the documented CLI (--root, --apply): guards against running from inside a worktree (worktree-gc.mjs:108-114), only acts on candidates under <root>/.claude/worktrees/ (worktree-gc.mjs:118-124), never touches the main checkout, and correctly dispositions locked/dirty/unmerged/removable before any --apply delete. The remaining 3 acceptance criteria stay human-verified (protocol/genome changes, not testable here) per my specify comment. See .scratch/organism-infra/handoffs/05-qa-verify.md.
- **unknown, 2026-09-28:** security, 2026-09-28: Security bounce (PR #17, SHA 21bdf02). Scope: scripts/worktree-gc.mjs. High: the --root guard added in 21bdf02 (worktree-gc.mjs:108-114, 'refuse to run when --root is not the main checkout') is non-functional. It checks entries.some(e => path === rootResolved) against git worktree list --porcelain, but that command lists every worktree (main and linked) identically regardless of which one you run it from -- confirmed live against a throwaway repo. So --root pointing at any linked worktree (including the default, process.cwd(), when a cell runs gc from inside its own worktree) still passes the check, silently defeating the one guard meant to catch this exact operator mistake. In current code this degrades to a harmless no-op (worktreesRoot ends up empty, 'no agent worktrees found') rather than an unintended delete, but it fails silently instead of erroring, and both the code comment and the qa verify note overstate what it does. board-service.mjs:60-77 (resolveRoot) already solves this correctly by taking the FIRST worktree entry from the same porcelain output; worktree-gc.mjs's guard should do the same (compare --root against entries[0], not entries.some). No test exercises this path either, despite it being named in the test file's own doc comment (lines 18-19). No command injection (execFileSync used with array args throughout, no shell:true) and no secrets in the diff; full findings in handoffs/05-security.md.
- **developer, 2026-09-28:** security bounce fixed: main-checkout guard compares entries[0], regression test added, pushed to PR #17 (d695045)
- **unknown, 2026-09-28:** security, 2026-09-28: Security re-review round 2 (PR #17, SHA d695045) after fix round 1. PASS. The prior High (scripts/worktree-gc.mjs:108-114, non-functional main-checkout guard) is fixed: entries[0] comparison now matches board-service.mjs's resolveRoot pattern, covered by a new regression test (--root pointed at a linked worktree is refused). Re-ran node --test scripts/worktree-gc.test.mjs: 10/10 pass. Diffed 21bdf02..d695045 for scripts/worktree-gc.test.mjs: only one test added, no deletions or weakened assertions. Full diff vs main (a5100bb) still scoped to scripts/worktree-gc.mjs and scripts/worktree-gc.test.mjs only, no dependency or CI changes, no secrets found. See handoffs/05-security-2.md.
- **unknown, 2026-09-28:** Orchestrator, 2026-09-28: worktree-gc merged as PR #17 (5eb06a6) with the user's approval, CI green. First --apply removed 15 worktrees; 3 dirty ones were kept. Still open: the process criteria, meaning the dispatch rule (free the branch before a dispatch; reviewers use a detached checkout of the SHA), running gc after each merge, the .claude/ policy, and enforcing usage-watch. These need a genome/protocol proposal to the user.
- **unknown, 2026-09-28:** Orchestrator, 2026-09-28: the user approved the process edits and I applied them. organism-protocol: .claude/ edits are orchestrator-only, with the user's permission. Orchestrator genome: free the branch before a dispatch (fix rounds check it out, reviewers take a detached SHA), run worktree-gc after each merge with --apply on the user's yes, and state usage % in every dispatch or merge question. This session ran two fix rounds, a qa verify and two security reviews on existing branches this way, with no denied git commands and no reset --hard.
