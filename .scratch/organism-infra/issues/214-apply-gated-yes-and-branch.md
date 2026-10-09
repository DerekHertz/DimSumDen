# 214: apply-gated: --yes for `!` mode and --branch to target a worktree

**Type:** bug

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Retro 2026-10-09 (212 relay). The documented `!npm run apply-gated` path failed twice in one ticket.

## What to build

1. **`--yes <name>`.** `scripts/apply-gated.mjs` reads the y/N answer from stdin, but inside Claude Code `!` commands get no stdin, so every prompt reads end-of-input and skips. Add `--yes <patch-name>` (repeatable): it applies only the named patch, without a prompt, after printing the same diff. Without the flag, behaviour is unchanged.
2. **`--branch <b>`.** The script applies to `process.cwd()`, so a patch for a feature branch, run from the main checkout as the docs say, commits on `main`. Add `--branch <b>`: it still reads patches from the main checkout's `.scratch/_handoffs/gated/`, but applies and commits in the worktree that has `<b>` checked out. With no such worktree, it refuses with a clear message. The patch moves to `gated/applied/` in the main checkout.
3. Update `docs/agents/gated-patches.md` (the user section and the cell section: the cell names its branch in the handoff) so the one-line user command is `!npm run apply-gated -- --branch <b> --yes <name>`.

## Acceptance criteria

- [ ] `--yes <name>` applies and commits only that patch with no stdin; other pending patches are untouched.
- [ ] `--branch <b>` commits in the worktree holding `<b>`, never in the main checkout; it refuses when no worktree holds `<b>`.
- [ ] Without the new flags, existing behaviour and tests are unchanged.
- [ ] The docs give a single `!` command that works.

## Comments
- **orchestrator, 2026-10-09:** Filed from the retro with the user's yes. On 212 the orchestrator moved the patch into the developer worktree by hand and the user needed `echo y |`. The stale 136 patch was retired to `gated/applied/*.stale` in the same board commit.
