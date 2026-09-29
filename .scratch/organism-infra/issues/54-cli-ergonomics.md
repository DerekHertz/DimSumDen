# 54: CLI ergonomics: scripts/board.mjs shim and npm run test:path

**Type:** task

**Priority:** P2

**What to build:**
- Add `scripts/board.mjs`, a thin shim that forwards its arguments and exit code to the real board CLI (`apps/organism-infra/board.mjs`). Three cells guessed this path in one session.
- Add `npm run test:path -- <file|dir>...`, which expands each directory to its `*.test.mjs` files and runs `node --test` on them. Node 22 rejects directory arguments, and three cells hit this.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `node scripts/board.mjs <args>` behaves exactly like `npm run board -- <args>` (tests)
- [ ] `npm run test:path -- apps/ui/src/panel` runs that directory's tests and exits non-zero on a failure (tests)

## Comments

- **Created (orchestrator, 2026-09-29):** From the post-UI v0 retro (causes 2 and 3), approved by the user.
