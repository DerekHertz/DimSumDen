# 32: Document --mode on claim and the handoff State block

**Type:** task

**Priority:** P2

**What to build:** Cells hit two undocumented requirements: `board claim` needs `--mode` for qa (specify|verify) and likely other moded cells, and `board release` refuses a handoff without a valid State block. Document both in organism-protocol and docs/agents/issue-tracker.md, and include them in the orchestrator's dispatch prompt template. Edits under `.claude/` need the user's OK.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] organism-protocol states which cells require --mode and the allowed values
- [ ] the handoff skill or protocol shows the State block format that release validates

## Comments

- **Created (orchestrator, 2026-09-28):** Friction reported by qa, developer and security cells during ticket 26's relay in WSL.
