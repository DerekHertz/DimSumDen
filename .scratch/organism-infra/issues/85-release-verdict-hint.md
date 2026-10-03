# 85: board release refuses --verdict with a hint

**Type:** fix

**Priority:** P3

**What to build:** Cells reach for `board release <ref> --verdict ...`, which is not a flag (72 qa, 07-ui-shell), then fumble reclaims and force releases. `board release` given `--verdict` exits non-zero before changing anything, and its message names the right sequence: `board comment <ref> --verdict <v>` while claimed, then `board release`.

**Blocked by:** none

**Status:** parked

- [ ] `board release <ref> --verdict pass` exits non-zero, leaves the lock and status unchanged, and prints a hint naming `comment --verdict` (test)
- [ ] `board release` without `--verdict` behaves as before (existing tests pass)

## Comments

- **Created (orchestrator, 2026-09-30):** pipeline-retro session 15, tool board-release, count 2.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
