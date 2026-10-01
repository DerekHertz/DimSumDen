# 54: CLI ergonomics: scripts/board.mjs shim and npm run test:path

**Type:** task

**Priority:** P2

**What to build:**
- Add `scripts/board.mjs`, a thin shim that forwards its arguments and exit code to the real board CLI (`apps/organism-infra/board.mjs`). Three cells guessed this path in one session.
- Add `npm run test:path -- <file|dir>...`, which expands each directory to its `*.test.mjs` files and runs `node --test` on them. Node 22 rejects directory arguments, and three cells hit this.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] `node scripts/board.mjs <args>` behaves exactly like `npm run board -- <args>` (tests)
- [ ] `npm run test:path -- apps/ui/src/panel` runs that directory's tests and exits non-zero on a failure (tests)

## Comments

- **Created (orchestrator, 2026-09-29):** From the post-UI v0 retro (causes 2 and 3), approved by the user.
- **developer, 2026-09-30:** Batch A developer done on feat/batchA-board-friction at c9f8ab0 (npm test 1208/1208). .claude parts scripted, not applied. See handoffs/54-developer.md
- **qa, 2026-09-30:** QA pass. 1208/1208. board-shim.test.mjs covers criterion 1 (shim forwards args, stdout, exit code identically to CLI, lines 75-123). scripts/test-path.test.mjs covers criterion 2 (test:path expands dirs to *.test.mjs, exits non-zero on failure, lines 31-97). scripts/board.mjs exists and is a 4-line import shim. package.json defines test:path. Test files unchanged from f7be419.
- **security, 2026-09-30:** Security pass: no critical/high findings; gitleaks 0 leaks; npm audit 0 vulns; all shell-outs use execFileSync/spawnSync without shell:true with no untrusted args; refuseWorktreeDraft path guard correct; no new dependencies.
