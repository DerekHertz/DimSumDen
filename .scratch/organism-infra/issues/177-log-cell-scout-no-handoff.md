# 177: `log-cell.mjs` doesn't require a handoff for scout rows

**Type:** bug

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** in-review

**Serves:** Pipeline retro, 2026-10-07. Scouts are read-only helpers and never publish a handoff, so `node scripts/log-cell.mjs --cell scout ...` is always refused without `--allow-no-handoff "<reason>"`. This session the orchestrator had to rerun two scout rows (user yes, 2026-10-07).

## What to build

In `scripts/log-cell.mjs`, skip the missing-handoff refusal when `--cell scout`. Every other cell type keeps the check, and `--allow-no-handoff` keeps working as it does now.

Files: `scripts/log-cell.mjs` and its tests.

## Acceptance criteria

- [ ] `log-cell.mjs --cell scout` with no handoff on the board writes its row and exits 0 (test)
- [ ] Any other cell type with no handoff and no `--allow-no-handoff` is still refused (test)
- [ ] The existing log-cell tests still pass

## Comments

- **orchestrator, 2026-10-07:** Filed from the pipeline retro (user yes, 2026-10-07).

- 2026-10-07 orchestrator: batch D = organism-infra/126 + organism-infra/177 (share scripts/log-cell.mjs). The user approved it on 2026-10-07; it will be dispatched in the next session. First cell: qa-specify (orchestrator and Jev agree).
- **security, 2026-10-07:** Security pass (batch D). Low: scripts/log-cell.mjs:83 scout skips handoff check by design; telemetry only. gitleaks clean. See 177-security.md.
