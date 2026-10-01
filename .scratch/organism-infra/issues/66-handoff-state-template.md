# 66: board handoff --template prints a valid State block

**Type:** feature

**Priority:** P1

**What to build:** Almost every cell's first `board handoff` on 2026-09-30 failed State-block validation (missing ticket name, `pending` as strings instead of `{item, owner}`, missing required keys), about 9 wasted calls. Add `board handoff <ref> --template [--cell <c>] [--mode <m>]` that prints a State block skeleton that already passes validation (ticket filled from the ref, cell/mode from the lock when held, every required key present, one example `pending` entry). Point the `handoff` skill at it with one line.

**Blocked by:** None

**Status:** resolved

- [ ] `--template` output, with its placeholders filled, passes the same validation `board handoff` runs (test)
- [ ] Ticket, cell and mode are pre-filled from the ref and the held lock (test)
- [ ] The handoff skill names the command (the `.claude/` edit is applied by the user)

## Comments
- **Retro (user, 2026-09-30):** approved as the code fix for the repeated State-block failures.
- **developer, 2026-09-30:** Batch A developer done on feat/batchA-board-friction at c9f8ab0 (npm test 1208/1208). .claude parts scripted, not applied. See handoffs/66-developer.md
- **qa, 2026-09-30:** QA pass. 1208/1208. board-handoff-template.test.mjs covers criterion 1 (template output passes validateState, lines 48-69) and criterion 2 (ticket/cell/mode pre-filled from ref and lock, lines 84-136). Criterion 3 (.claude/ edit naming the command) is human-verified: organism-protocol SKILL.md and handoff SKILL.md updated in commit 1191686. Test files unchanged from f7be419.
- **security, 2026-09-30:** Security pass: no critical/high findings; gitleaks 0 leaks; npm audit 0 vulns; all shell-outs use execFileSync/spawnSync without shell:true with no untrusted args; refuseWorktreeDraft path guard correct; no new dependencies.
