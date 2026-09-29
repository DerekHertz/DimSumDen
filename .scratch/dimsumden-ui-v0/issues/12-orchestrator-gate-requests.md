# 12: Orchestrator genome: handle Gate requests

**Type:** task

**Priority:** P1

**What to build:** Edit `.claude/agents/orchestrator.md` (user-gated): at each loop step, run `node scripts/requests.mjs --list`, treat a pending Gate request as the user's answer to that gate, act, and mark it handled with the outcome.

**Blocked by:** 06

**Status:** resolved

- [ ] Genome step added; the user approves the `.claude/` edit
- [ ] One end-to-end dry run: a UI Approve is picked up and handled

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
