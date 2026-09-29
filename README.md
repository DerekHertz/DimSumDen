# Dim Sum Den

A local control room for watching and steering a small team of AI agents across the software lifecycle. The team is modeled as an organism, and its body is Bao, a large plush panda that the agents perch on.

![Bao with cells perched on the body](design/3d/renders/l1-hero-3d-v3.jpg)

*A render from `design/3d/renders/`, the design reference for the den, not a capture of the running app.*

## The problem

Give several agents real tickets and you get speed, and you lose the thread. Who is working on what? Which change is waiting on a human? What did the last agent decide, and what did it skip? Dim Sum Den is my answer: agents work through a strict relay on a plain-file board, they stop at gates that only I can open, and a 3D den shows the state at a glance. The agents build it, and I sit at the Pass deciding what goes out.

## How it works

- **Cells.** A cell is one running agent doing one ticket, usually in its own git worktree. Its role (a cell type) is a "genome": a markdown file in `.claude/agents/` that sets its model, tools, skills and done criteria. There are ten: `product`, `architect`, `orchestrator`, `developer`, `scout`, `debugger`, `qa`, `security`, `designer` and `herald`.
- **Stations.** Cell types are grouped by the outcome they own:
  - the Pass (orchestrator, product, architect) decides and sequences;
  - Steamers (developer, scout, debugger) build and dig;
  - Tea & Pantry (qa, security) taste and guard;
  - Front of House (designer, herald) keeps things looking right and writes the public posts.
- **The relay.** Code tickets are not a swarm ([ADR 0002](docs/adr/0002-relay-not-swarm.md)). qa writes failing tests, developer makes them pass, qa verifies, security reviews, then the orchestrator proposes the merge.
- **Pass gates.** Cells stop and ask before merging, pushing, opening a PR, adding a dependency, or editing an ADR or their own genomes. Nothing lands on `main` without a yes from me.
- **The file board.** Tickets are markdown under `.scratch/`, claimed with lock files, handed off through a `board` CLI ([ADR 0003](docs/adr/0003-local-file-board.md), [ADR 0008](docs/adr/0008-board-service.md)). No database, no server, and every state change is diffable.
- **The den UI.** `apps/ui` is a React + React Three Fiber scene of Bao and the cells, with a dashboard panel for the queue, gates and a usage meter. It talks to a localhost bridge (`apps/bridge`, bound to `127.0.0.1`) that reads the board, streams changes over server-sent events at `/events`, and serves `/state` and `/metrics`. The one thing the UI writes is a request to approve or reject a merge or dispatch gate, appended to a log for the orchestrator to act on ([ADR 0011](docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md)).

## What is built

- The file board and its CLI (`apps/organism-infra`): claim, comment, handoff, release, reclaim, with locks and a release gate that refuses without a handoff.
- The ten cell genomes and the shared skills they follow (`.claude/`).
- CI helpers (`apps/ci-cd`): a dev server, an HTTP smoke check and a browser smoke check of the UI (Playwright).
- The localhost bridge and the first version of the den UI, including the plush cell models, roaming, a market layout for the stations and handoff animations (`apps/ui/src/scene`).
- Mechanical checks for the rules agents skip most ([ADR 0009](docs/adr/0009-mechanical-checks-for-most-skipped-rules.md)), such as `npm run risk-check` and `npm run check:bom`.

Not built: steering beyond gate approval (the den observes and approves; it does not yet dispatch cells itself), and runtimes other than Claude Code ([ADR 0004](docs/adr/0004-runtime-adapter.md) sketches the adapter).

## Numbers

Each can be re-run.

- **85 commits on `main`**, 11 of them merges, as of `69a4a57`: `git log --oneline 69a4a57 | wc -l` and `git log --oneline 69a4a57 --merges | wc -l`.
- **78 test files** under `apps/`, `packages/` and `scripts/`: `find apps packages scripts -name "*.test.mjs" -not -path "*/node_modules/*" | wc -l`.
- **52 recorded cell runs across 14 tickets used about 3.04 million tokens and 194 minutes of cell time** (an average of about 58k tokens and under 4 minutes per run). Source: the `kind:"cell"` rows of `.scratch/usage.jsonl` on the branch `origin/claude/lucid-gates-42g8ft`, summing `tokens` and `ms`. Some of those rows are marked `backfill:true`, meaning they were reconstructed after the fact rather than logged live.

## Quick start

Needs Node and npm. The UI is a local tool; it is not deployed anywhere.

```
npm ci
npm test              # node:test across apps, packages and scripts
npm run ui            # build the UI, then start the bridge (default port 4317)
npm run ui:dev        # Vite dev server for the UI on its own
npm run smoke         # HTTP smoke check
npm run smoke:ui      # browser smoke check (Playwright + Chromium)
npm run board -- status <feature>/<NN-slug>
```

Cells are run as Claude Code sessions, for example `claude --agent developer`. Cells use your own Claude subscription through the CLI ([ADR 0001](docs/adr/0001-subscription-cli-cells.md)).

## Read more

- [`CONTEXT.md`](CONTEXT.md): the vocabulary (organism, station, cell, genome, Bao, perch, and the rest).
- [`docs/adr/`](docs/adr/): the thirteen recorded decisions and why they were made.
- [`docs/agents/`](docs/agents/): how cells use the board, worktrees and process hygiene.
- [`LICENSE`](LICENSE): MIT.
