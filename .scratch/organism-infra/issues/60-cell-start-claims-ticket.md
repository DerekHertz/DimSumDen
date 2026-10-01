# 60: cell-start claims the ticket

**Type:** task

**Priority:** P2

**What to build:** `node scripts/cell-start.mjs ... --ticket <ref> --cell <type> [--mode <m>]` runs `board claim` itself after setting up the worktree, before the cell does any work, and exits non-zero if the claim fails. Without `--ticket`, behaviour is unchanged.

**Blocked by:** None

**Status:** resolved

- [ ] `--ticket` claims before exiting 0; a refused claim exits non-zero with the board's message
- [ ] Without `--ticket`, unchanged
- [ ] `docs/agents/cell-start.md` documents the flag, and the orchestrator's dispatch lines pass it

## Comments
- **Retro (orchestrator, 2026-09-29):** qa claimed after writing and pushing tests twice on showcase-v1/07. Wording already says to claim first, so this is a code fix. User approved.

- **Renumbered (orchestrator, 2026-09-29):** was cloud organism-infra/31; the local board used that number for a different ticket.
- **developer, 2026-09-30:** Batch A developer done on feat/batchA-board-friction at c9f8ab0 (npm test 1208/1208). .claude parts scripted, not applied. See handoffs/60-developer.md
- **qa, 2026-09-30:** QA pass. 1208/1208. cell-start-ticket-claim.test.mjs covers criterion 1 (--ticket claims on success, exits non-zero on refused claim or bad ref, lines 107-149) and criterion 2 (without --ticket unchanged, lines 153-165). Criterion 3 (docs/agents/cell-start.md) is human-verified: file updated with --ticket flag docs. Orchestrator genome dispatch lines updated in commit 1191686. Test files unchanged from f7be419.
- **security, 2026-09-30:** Security pass: no critical/high findings; gitleaks 0 leaks; npm audit 0 vulns; all shell-outs use execFileSync/spawnSync without shell:true with no untrusted args; refuseWorktreeDraft path guard correct; no new dependencies.
