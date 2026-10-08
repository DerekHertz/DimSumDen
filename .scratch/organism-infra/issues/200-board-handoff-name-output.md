# 200: board handoff --name prints the file it actually wrote

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay hygiene (pipeline-retro 2026-10-08).

## What to build

`board handoff --name 142-qa-specify-2.md` wrote the -2 file but printed 'published .../142-qa-specify.md'. Separately, `--cell` and `--mode` without `--template` are refused with a message that does not say what to do.

**Merged from 178 (handoff pending string shape), 2026-10-08:** When a handoff's State block `pending` holds a plain string, `board handoff` stores it as `{item: <string>, owner: <the publishing cell type>}` and goes on. Any other malformed `pending` entry (a number, an object without `item`) is still refused, and the refusal message shows one valid example entry: `{"item": "...", "owner": "<cell>"}`. `board release` reads the stored form, so a handoff that publishes cleanly never makes release refuse over `pending`.

## Acceptance criteria

- [ ] The published line names the file actually written.
- [ ] The `--cell` / `--mode` refusal says to add `--template` or drop the flags.
- [ ] `npm test` green.
- [ ] A handoff whose `pending` is `["do X"]`, published by cell `orchestrator`, publishes, and the stored State block has `{"item": "do X", "owner": "orchestrator"}` (test)
- [ ] `board release` after that publish succeeds (test)
- [ ] A `pending` entry that is neither a string nor an object with `item` is refused, and the message contains an example `{"item": ..., "owner": ...}` entry (test)

## Comments
- **orchestrator, 2026-10-08:** Filed from the pipeline-retro on the user's yes.
- **orchestrator, 2026-10-08:** User 2026-10-08: parked 178 (handoff pending string shape) merged into this ticket; its scope and criteria are above. 178 closed.
