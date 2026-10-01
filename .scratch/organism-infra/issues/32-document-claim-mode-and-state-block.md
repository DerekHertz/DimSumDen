# 32: Document --mode on claim and the handoff State block

**Type:** task

**Priority:** P2

**What to build:** Cells hit two undocumented requirements: `board claim` needs `--mode` for qa (specify|verify) and likely other moded cells, and `board release` refuses a handoff without a valid State block. Document both in organism-protocol and docs/agents/issue-tracker.md, and include them in the orchestrator's dispatch prompt template. Edits under `.claude/` need the user's OK.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] organism-protocol states which cells require --mode and the allowed values
- [ ] the handoff skill or protocol shows the State block format that release validates

## Comments

- **Created (orchestrator, 2026-09-28):** Friction reported by qa, developer and security cells during ticket 26's relay in WSL.
- **developer, 2026-09-30:** Batch A developer done on feat/batchA-board-friction at c9f8ab0 (npm test 1208/1208). issue-tracker.md done; .claude parts scripted, not applied. See handoffs/32-developer.md
- **qa, 2026-09-30:** QA pass. 1208/1208. Both criteria met: (1) organism-protocol SKILL.md now states which cells require --mode and allowed values (commit 1191686 diff line +1); docs/agents/issue-tracker.md line 10 lists Claim modes. (2) handoff skill SKILL.md and organism-protocol both name --template and /tmp drafting. No automated tests (QA specify decision: doc/.claude tickets have no tests; human-verified). Test files unchanged from f7be419.
- **security, 2026-09-30:** Security pass: no critical/high findings; gitleaks 0 leaks; npm audit 0 vulns; all shell-outs use execFileSync/spawnSync without shell:true with no untrusted args; refuseWorktreeDraft path guard correct; no new dependencies.
