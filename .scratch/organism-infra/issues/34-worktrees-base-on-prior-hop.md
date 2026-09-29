# 34: Cell worktrees start at the previous hop's commit

**Type:** task

**What to build:** Agent-tool worktrees always start at `main`, so each relay hop must first merge or branch from the prior hop's commit by hand (the orchestrator puts `git merge --ff-only <sha>` or `git switch -c <branch> <sha>` in every prompt). Make the base commit part of dispatch: a documented dispatch step or a helper script that prepares the worktree at the right commit, so cells don't depend on prompt wording. From ticket 27's migration checklist, item 4.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] A developer dispatched after qa specify starts on qa's tests commit without a manual merge step
- [ ] Reviewers (qa verify, security) start detached at the developer's commit
- [ ] The orchestrator genome or dispatch docs describe the mechanism

## Comments

- **Created (orchestrator, 2026-09-28):** From 27 checklist item 4.
- **Scope added (orchestrator, 2026-09-28):** Add a test that `resolveRoot` returns the main checkout when run from a worktree with ORGANISM_ROOT unset (from 29).
- **Mechanism (orchestrator, 2026-09-28):** a helper `node scripts/cell-start.mjs --base <sha> [--branch <name> | --detach]` that a cell runs first in its worktree: refuses if the worktree is dirty or if it is the main checkout, then switches to a new branch at <sha> (or detaches there), then runs `npm ci`. The orchestrator puts the one command in the prompt instead of manual git steps. Keep it a single plain command so the isolation guard allows it.
- **qa, 2026-09-28:** QA pass: 254 tests green, specify tests unchanged, cell-start --detach allowed by guard. See handoffs/34-qa-verify.md
- **security, 2026-09-28:** Security pass. No critical/high. MEDIUM scripts/cell-start.mjs:66 npm ci has no cwd; a --base commit lacking root package.json makes npm climb to the main checkout and reinstall its node_modules (reproduced in scratch repo). LOW :44-49 main check fails open if worktree list fails; LOW :66 npm ci runs lifecycle scripts from reviewed commit (none today); LOW :28 -x accepted at parse. No shell use, no arg injection, main refusal not bypassable, no secrets/deps. Detail: handoffs/34-security.md
- **qa, 2026-09-28:** QA pass at e044bb7 (fix1 re-verify): 258/258, security MEDIUM+LOW addressed, no test weakened, live cell-start ok. See 34-qa-verify2.md
- **security, 2026-09-28:** Security pass (re-check e044bb7): MEDIUM npm-ci cwd and LOW fail-open fixed, nothing new. Details: handoffs/34-security2.md
- **Resolved (orchestrator, 2026-09-28):** Merged as PR #30. 1 bounce (security MEDIUM npm ci cwd). Open follow-up: --ignore-scripts for review hops.
