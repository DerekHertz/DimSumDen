# 03: Target project: run a den task on another repo

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** agent-os/04 (resolved, PR #220). The host list criterion and any web use in the live run wait on agent-os/02.

**Status:** in-review

**Serves:** agent-os step 3 (ADR 0021 decision 14; ADR 0019 decision 9, the testbed). User story 6.

## What to build

The bridge is started against one target project directory. A task started from the den runs in a worktree of that project, with role files and settings from this repo and the board in the target repo. First target: `safety-aware-route-planner` (Python); `family-bingo` after.

Start with a short design note answering the two unknowns, before any code:

1. How does a role load when the agent's working directory is another repo? The CLI finds role files from the project it runs in; the target's own `.claude/` must not be loaded (it is a route for hostile content).
2. Where does the board sit in the target repo, and how does the bridge find it?

Then:

- The bridge takes the target's path at start and refuses one that is not a git repo.
- The project's host list is a file in this repo that the user approves (ADR 0021 decision 4).
- Worktrees, branches and the ledger keep working with the target as root.
- Board calls from the agent still raise requests at this step; they move to the bridge in step 4.

## Acceptance criteria

- [ ] The design note is written as an ADR 0021 amendment and the user has read it.
- [ ] Failing tests first: the bridge started against a second fixture repo writes the ticket there and starts the agent in a worktree of that repo.
- [ ] A test shows a `.claude/` folder in the target repo is not loaded.
- [ ] One recorded live run: a scout task on `safety-aware-route-planner`, started from the den, reaches its result.
- [ ] The friction found in that run is listed here as a comment. It decides the order of steps 4 to 8.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Comments

- 2026-10-10, plain session (Opus 5.5): filed from the approved agent-os spec. Not started. Nobody has looked inside the target repo yet.
- **orchestrator, 2026-10-11:** Blocker changed from agent-os/02 to agent-os/04 (user, 2026-10-11): 04 delivered the ceilings and the wall. The host list criterion and any web use in the live run still wait on 02.
- **orchestrator, 2026-10-12:** The user read PR #229 and said it is good (2026-10-12). Criterion 1's read is done; the decisions on the split, settings.json, the target CLAUDE.md and the clone path are still to be put to them.
- **orchestrator, 2026-10-12:** User rulings (2026-10-12): merge PR #229; split 03 into A / B / C as the architect proposed; a target's CLAUDE.md stays unloaded. Still open: whether den tasks on this repo also stop loading .claude/settings.json (the user asked for a clearer explanation), and the path of the safety-aware-route-planner clone.
