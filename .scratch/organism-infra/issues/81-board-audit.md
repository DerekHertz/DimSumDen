# 81: `board audit` flags stale tickets and handoffs

**Type:** feature

**Priority:** P1

**What to build:** A read-only `board audit` command that scans every feature's tickets, locks and handoffs and prints the inconsistencies a session would otherwise find by hand. `pipeline-retro` runs it at every session end.

Source: user request, 2026-09-30 (batch A).

**Blocked by:** none

**Status:** resolved

- [ ] Flags a ticket at `in-review` or `claimed` with no `.lock`.
- [ ] Flags a `.lock` whose ticket has no matching git worktree or branch.
- [ ] Flags a ticket whose `Blocked by` lists only resolved tickets (it is actually unblocked) and one blocked by a ticket that does not exist.
- [ ] Flags a published handoff whose State `pending` items name the ticket but have no matching ticket comment or open ticket.
- [ ] Flags open tickets with no board event or comment in N days (`--stale-days`, default 7).
- [ ] Output is one line per finding (`<ref> <kind> <detail>`) plus `--json`; exit 0 when clean, 1 when there are findings, 2 on bad arguments. It never writes to the board.
- [ ] `pipeline-retro` calls it (a `.claude/` edit: the developer writes it into the handoff and the user applies it).

## Comments
- **Created (orchestrator, 2026-09-30):** Batched with 78, 66, 60, 32, 54 and 82 as batch A.
- **developer, 2026-09-30:** Batch A developer done on feat/batchA-board-friction at c9f8ab0 (npm test 1208/1208). .claude parts scripted, not applied. See handoffs/81-developer.md
- **qa, 2026-09-30:** QA pass. 1208/1208. board-audit.test.mjs covers criteria 1-6: flags claimed/in-review with no lock (lines 57-85); flags lock with no worktree/branch (lines 99-111); flags unblocked and missing blocked-by (lines 115-150); flags orphan pending (lines 154-171); flags stale tickets (lines 177-204); output format, --json, exit codes 0/1/2, read-only (lines 208-261). Criterion 7 (pipeline-retro calls audit) is human-verified: pipeline-retro SKILL.md updated in commit 1191686. Test files unchanged from f7be419.
- **security, 2026-09-30:** Security pass: no critical/high findings; gitleaks 0 leaks; npm audit 0 vulns; all shell-outs use execFileSync/spawnSync without shell:true with no untrusted args; refuseWorktreeDraft path guard correct; no new dependencies.
