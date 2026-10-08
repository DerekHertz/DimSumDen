# 200: board handoff --name prints the file it actually wrote

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay hygiene (pipeline-retro 2026-10-08).

## What to build

`board handoff --name 142-qa-specify-2.md` wrote the -2 file but printed 'published .../142-qa-specify.md'. Separately, `--cell` and `--mode` without `--template` are refused with a message that does not say what to do.

## Acceptance criteria

- [ ] The published line names the file actually written.
- [ ] The `--cell` / `--mode` refusal says to add `--template` or drop the flags.
- [ ] `npm test` green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the pipeline-retro on the user's yes.
