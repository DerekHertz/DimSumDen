# Running the organism in a cloud session

A living log of what works and what costs too much when the orchestrator runs in a claude.ai/code cloud container. Update it at the end of each cloud session. Numbers come from `.scratch/usage.jsonl`.

## What works

- **Board branch:** all board writes (tickets, handoffs, `usage.jsonl`) commit and push to `claude/lucid-gates-42g8ft`, the branch behind draft PR 60. The user authorised pushing there directly (2026-09-29).
- **Cell start:** `node scripts/cell-start.mjs --base <sha> --detach` works in the cloud for reviewers.
- **Risk-check through scout:** a scout in a temporary detached worktree runs `npm ci` and `npm run risk-check -- origin/main...HEAD`, and also checks for merge conflicts. It costs about 11k tokens and 18 s.
- **PRs:** the GitHub MCP tools open, watch and squash-merge PRs; `gh` is not available. After you subscribe to a PR, a `check_suite.completed` event arrives when CI finishes, so there is no need to poll.
- **Browser checks:** the user checks visuals in WSL; cloud Chromium can't run the pinned Playwright. qa verify notes the skipped `smoke:ui` tests and relies on the user's check.

## Cost per step (cloud, 2026-09-29)

| Step | Tokens | Time |
|---|---|---|
| qa verify (full, ticket 06) | 36k | 130 s |
| scout risk-check and merge-tree | 11k | 18 s |
| Ticket 06, from qa verify to merge | about 2 cloud credits | about 10 min |

## Friction to fix

- **Usage numbers:** `usage.mjs` can't read credentials in the cloud, so the user reports cloud credits by hand. Log them as `cloud_credits` in the usage row.
- **Board commits from cells:** the worktree guard blocks a cell from running `git` in the main checkout, so cells can't commit board files there. The orchestrator commits what they leave behind. Until that's fixed, the stop hook flags the uncommitted files while a cell is running.
- **board CLI:** `claim <ref> <cellType>` takes the cell type as a positional argument, not a flag. Every item in a handoff's `pending` list must be `{item, owner}`, or `release` refuses the handoff. qa hit the same State-block check (it was missing `mode`) and had to publish its handoff as `-2`.
- **5 browser tests fail in cloud `npm test`:** they need Chromium 1243. Consider skipping them when that browser is missing, or installing it in the environment's setup script.

## Worth considering

- A SessionStart hook or environment setup script that runs `npm ci` and fetches the board branch, so a new session is ready without setup steps.
- Pin the matching Chromium in the environment so `smoke:ui` runs in the cloud and the user's browser check becomes a final look rather than the only check.
