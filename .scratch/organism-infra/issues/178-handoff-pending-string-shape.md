# 178: `board handoff` takes a plain-string pending item, or says what shape it wants

**Type:** fix

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** Pipeline retro, 2026-10-07. Three times (den-layout/01, 162, 140) the orchestrator published a resolve handoff whose State block `pending` held plain strings instead of `{item, owner}` objects. The publish or the following `board release` refused, and the message did not show the expected shape, so each one took extra rounds.

## What to build

When a handoff's State block `pending` holds a plain string, `board handoff` stores it as `{item: <string>, owner: <the publishing cell type>}` and goes on. Any other malformed `pending` entry (a number, an object without `item`) is still refused, and the refusal message shows one valid example entry: `{"item": "...", "owner": "<cell>"}`. `board release` reads the stored form, so a handoff that publishes cleanly never makes release refuse over `pending`.

Files: the board CLI's handoff/State-block validation in `apps/organism-infra/` and its tests.

## Acceptance criteria

- [ ] A handoff whose `pending` is `["do X"]`, published by cell `orchestrator`, publishes, and the stored State block has `{"item": "do X", "owner": "orchestrator"}` (test)
- [ ] `board release` after that publish succeeds (test)
- [ ] A `pending` entry that is neither a string nor an object with `item` is refused, and the message contains an example `{"item": ..., "owner": ...}` entry (test)
- [ ] The existing board tests still pass

## Comments

- **orchestrator, 2026-10-07:** Filed from the pipeline retro (user yes, 2026-10-07).
- **orchestrator, 2026-10-07:** Parked: User 2026-10-07: north star first (den v1 loop). Pipeline work waits; unpark after den-v1/07 or on a 3rd repeat incident that blocks the relay.
