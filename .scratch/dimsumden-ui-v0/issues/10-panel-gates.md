# 10: Panel: merge and dispatch approve/reject buttons

**Type:** feature

**Priority:** P0

**What to build:** Buttons on tickets awaiting a merge or dispatch decision POST a Gate request; pending requests show as pending until handled. Designer reviews after qa.

**Blocked by:** 06, 09

**Status:** resolved

- [ ] Pressing Approve creates one request line and shows it pending (browser smoke)
- [ ] A handled request clears its pending mark (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** QA pass: 631/631, tests unchanged since specify, criterion 1 human-verified (browser smoke, designer), criterion 2 covered.
