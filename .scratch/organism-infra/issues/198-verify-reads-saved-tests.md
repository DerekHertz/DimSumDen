# 198: qa verify reads the saved test output instead of re-running the suite

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** in-review

**Serves:** Relay hygiene (pipeline-retro 2026-10-08).

## What to build

Three cells (141 developer, 194 qa, 142 qa) sent the full `npm test` run to a background scout, then ended their turn waiting, with no result. The orchestrator already saves the developer's run to `/tmp/<NN>-tests.txt` before verify. Add `--tests <file>` to `scripts/dispatch-prompt.mjs` for qa verify. It should print a line that names the file and tells qa to use it as the suite result. The file must pass the same exposure check `jev.mjs verify --tests` uses.

## Acceptance criteria

- [ ] `dispatch-prompt.mjs --cell qa --mode verify --tests <file>` prints a line naming the file.
- [ ] A path the exposure check refuses (hidden dir, symlink, over 1 MB) exits 2.
- [ ] The orchestrator genome's stage 3 passes the same file to both jev verify and dispatch-prompt (gated .claude edit, applied by the user).
- [ ] `npm test` green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the pipeline-retro on the user's yes.
