# 198: qa verify reads the saved test output instead of re-running the suite

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** resolved

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
- **qa, 2026-10-08:** reclaim: haiku qa verify returned partial without handoff; re-dispatching verify
- **qa, 2026-10-08:** QA pass (full verify, a3ead5a). Criteria 1, 2 and 4 covered by passing specify tests; saved suite 2605 pass, 0 fail, 0 skipped. Criterion 3 human-verified. Gate note: .claude/agents/orchestrator.md:41,52 changed on the branch; the same change is also in the gated patch. Details in handoff.
- **security, 2026-10-08:** Security pass (a3ead5a). No critical/high. Low: dispatch-prompt.mjs:158 path unescaped in prompt line (orchestrator-chosen, no fix); :119-127 check-then-use gap, negligible. gitleaks clean; no deps/CI changes. See 198-security.md.
