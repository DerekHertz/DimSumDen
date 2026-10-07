# 179: `board help` lists the commands

**Type:** fix

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** Pipeline retro, 2026-10-07. Twice the orchestrator ran `npm run board -- --help` to find a command and got `board: unknown command: --help`.

## What to build

`board help`, `board --help` and `board -h` print each board command with a one-line summary and exit 0. An unknown command still exits nonzero, and its message now ends with `run "board help" for the list`.

Files: `apps/organism-infra/board.mjs` and its tests.

## Acceptance criteria

- [ ] `board help`, `board --help` and `board -h` exit 0 and print every command the CLI dispatches on, each with a summary (test: the printed list matches the CLI's command table, so a new command cannot be left out)
- [ ] An unknown command exits nonzero and its message names `board help` (test)
- [ ] The existing board tests still pass

## Comments

- **orchestrator, 2026-10-07:** Filed from the pipeline retro (user yes, 2026-10-07).
- **orchestrator, 2026-10-07:** Parked: User 2026-10-07: north star first (den v1 loop). Pipeline work waits; unpark after den-v1/07 or on a 3rd repeat incident that blocks the relay.
