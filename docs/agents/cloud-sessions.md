# Running the organism in a cloud session

A living log of what works and what costs too much when the orchestrator runs in a claude.ai/code cloud container. Update it at the end of each cloud session. Numbers come from `.scratch/usage.jsonl`.

## What works

- **Board branch:** each cloud session commits board writes (tickets, handoffs, `usage.jsonl`) to its own session branch and opens a draft board PR; the user merges it at the end. A new session, cloud or local, starts from `main`.
- **Cell start:** `node scripts/cell-start.mjs --base <sha> --detach` works in the cloud for reviewers.
- **Risk-check through scout:** a scout in a temporary detached worktree runs `npm ci` and `npm run risk-check -- origin/main...HEAD`, and also checks for merge conflicts. It costs about 11k tokens and 18 s.
- **PRs:** the GitHub MCP tools open, watch and squash-merge PRs; `gh` is not available. After you subscribe to a PR, a `check_suite.completed` event arrives when CI finishes, so there is no need to poll.
- **Browser checks:** set `PW_CHROMIUM_PATH` (below) and the full test suite, `smoke:ui` included, runs green in the cloud (the font is self-hosted since PR 83). The user's browser check stays the visual verdict.

## Cost per step (cloud, 2026-09-29)

| Step | Tokens | Time |
|---|---|---|
| qa verify (full, ticket 06) | 36k | 130 s |
| designer spec (ticket 07) | 55k | 100 s |
| qa specify (ticket 07) | 53k | 95 s |
| developer (ticket 07) | 51k | 144 s |
| qa light verify (ticket 07) | 40k | 186 s |
| scout risk-check and merge-tree | 11k | 18 s |
| Ticket 06, from qa verify to merge | about 2 cloud credits | about 10 min |

## Friction to fix

- **Usage numbers:** `usage.mjs` can't read credentials in the cloud. Ask the user to paste `/usage` and log its 5-hour and weekly % in the usage row (cloud credits are no longer read).
- **Jev behind the proxy:** Node's built-in fetch ignores `HTTPS_PROXY`, so `jev.mjs` gets a 403 and falls back. Run it with `NODE_USE_ENV_PROXY=1` (or set that in the environment).
- **gitleaks is not installed:** security falls back to a pattern grep; CI still runs gitleaks. Install it in the environment's setup script to fix.
- **Stale local `main`:** the cloud clone's local `main` can lag, so run `node scripts/risk-check.mjs origin/main...HEAD` rather than the `main...HEAD` default.
- **Board commits from cells:** the worktree guard blocks a cell from running `git` in the main checkout, so cells can't commit board files there. The orchestrator commits what they leave behind. Until that's fixed, the stop hook flags the uncommitted files while a cell is running.
- **board CLI:** `claim <ref> <cellType>` takes the cell type as a positional argument, not a flag. Every item in a handoff's `pending` list must be `{item, owner}`, or `release` refuses the handoff. qa hit the same State-block check (it was missing `mode`) and had to publish its handoff as `-2`.
- **Resuming a finished cell loses its worktree:** after a cell returns, its worktree is cleaned up, so a resumed cell (SendMessage) runs in the main checkout and `cell-start` refuses. Re-dispatch a fresh cell instead of resuming.

## Worth considering

- A SessionStart hook or environment setup script that runs `npm ci` and fetches the board branch, so a new session is ready without setup steps.
- Pin the matching Chromium in the environment so `smoke:ui` runs in the cloud and the user's browser check becomes a final look rather than the only check.

## Browser tests (Chromium 1194)

Cloud sessions ship Chromium 1194 at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, but the installed Playwright wants a different build, so browser launches fail with "Executable doesn't exist". Point the launchers at the preinstalled binary:

```
export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium
```

(`/opt/pw-browsers/chromium` worked on 2026-09-30; the versioned path above it may change between container images.)

`npm run smoke` and `npm run smoke:ui` (via `apps/ci-cd/launch-options.mjs`) then launch that executable with the software-GL flags `--use-angle=swiftshader --enable-unsafe-swiftshader`, ignoring the Chrome/Edge channel lookup. Unset or empty means today's behaviour.

## Codex cloud session (2026-09-30)

This session used gh successfully for PR and CI operations after api.github.com was allowed in environment network settings. Node 24.19, npm 11.9, and Chromium 151 were available. Use the reviewed environment setup for actual paths; historical Claude container paths above are not universal defaults.

The working commands used npm_config_cache=/workspace/.npm and PW_CHROMIUM_PATH=/usr/bin/chromium. Full tests needed per-command TMPDIR=/home/agent/dimsumden-test-tmp with supported execution approval: platform guards at /tmp, /var/tmp, and /workspace otherwise made ancestry-sensitive fixture tests fail. Do not remove guards or weaken tests. Do not globally bind the isolated test directory as the platform temporary root.

Codex CLI 0.159.0-alpha.3 supports account/rateLimits/read through app-server JSON-RPC after initialize/initialized. Temporary sqlite_home avoided a read-only state directory; the outer namespace needed supported execution approval. The account usage request then failed at chatgpt.com/backend-api/wham/usage because the network proxy blocked that domain. The environment draft adds api.github.com and chatgpt.com; saving a draft does not itself change runtime access. No credentials or account response secrets were copied. No live usage percentages were obtained; manual figures are attributed to the user.

Cells did not inherit the writable npm cache automatically; cell-start must receive the environment binding from setup. Subagent tools did not expose token/duration metrics, so telemetry must not substitute placeholder zero counts. Existing board and handoff guards correctly refused overlapping claims, cross-claim handoff overwrites, and stale release state.
