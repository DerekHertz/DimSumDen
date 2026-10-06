# 147: dispatch-prompt script prints the required dispatch lines

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Testbed friction: hand-written dispatch prompts carry wrong paths and flags (missing `issues/` in a ticket path; cell-start said to run from the main checkout), which costs cells retries.

## What to build

`node scripts/dispatch-prompt.mjs --ticket <feature>/<NN-slug> --cell <type> [--mode <m>] [--base <sha> | --branch <b>] [--continue] [--batch <name>]` prints the mandatory lines of a relay dispatch prompt, so the orchestrator pastes them instead of writing them:
- the ticket path, including `issues/`, checked to exist;
- the `cell-start` line with the right flags for the cell and mode (developer: `--base --branch`; reviewers: `--detach`; `--continue` on later hops), plus the note that it runs inside the cell's worktree;
- the handoff path to write;
- the Start-here context line, only for architect, qa specify and developer, and only when `dispatch-context.mjs` gives a path;
- the release status flag this hop must use (`--status in-review`, `--keep-status`, or `--status ready-for-agent` for a design-only review).

It writes nothing. Bad arguments exit 2. The orchestrator genome is changed to use it (a gated edit: the developer writes the exact diff in its handoff).

## Acceptance criteria

- [ ] For each cell and mode the relay uses, the output has the right cell-start flags and release flag (table test)
- [ ] A ticket ref that doesn't resolve to `.scratch/<feature>/issues/<NN-slug>.md` exits 2 (test)
- [ ] The Start-here line appears only for architect, qa specify and developer (test)
- [ ] The handoff contains the exact orchestrator-genome diff for the user to apply

## Comments

- **orchestrator, 2026-10-05:** Filed from pipeline-retro (user yes 2026-10-05). Incidents: 08 (path missing `issues/`), 106 (cell-start from the main checkout, two cells).
- **orchestrator, 2026-10-05:** Add to scope: on a re-dispatch after a partial, the printed handoff path must be a new name (`<NN>-<cell>[-<mode>]-<k>.md`), because `board handoff` refuses to overwrite a handoff published under an earlier claim. Two cells hit this (138 developer 2, 139 qa specify 2).
