# 170: apply-gated applies a branch's gated patch in that branch's worktree

**Type:** enhancement

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** Gated `.claude/` edits on a relay branch (docs/agents/gated-patches.md). Retro 2026-10-06: `npm run apply-gated` only targets the checkout it runs in, so batch C's gated protocol edit needed a hand-written `git -C <worktree> apply` plus commit. The multi-line command wrapped when the user pasted it and failed, and the orchestrator then committed the patch while it was still in `gated/` instead of `gated/applied/` (user yes, 2026-10-06).

## What to build

1. `scripts/apply-gated.mjs` takes `--worktree <path>`. Patches are still read from the main checkout's `.scratch/_handoffs/gated/`, but each one is checked, applied and committed in `<path>`, staging only the paths the patch touches, with the same `y` prompt as today.
2. After a successful commit in the worktree, the patch moves to the main checkout's `gated/applied/`. The script prints the one board-only `git add`/`git commit` the orchestrator runs on main, or does that commit itself if that's simpler.
3. `--worktree` must name a registered worktree of this repo (`git worktree list`). Anything else exits 2 with a message, and nothing is applied.
4. The orchestrator can then give the user one short command: `!npm run apply-gated -- --worktree <path>`.

Files: `scripts/apply-gated.mjs`, its tests, `docs/agents/gated-patches.md`.

## Acceptance criteria

- [ ] With `--worktree <path>`, an approved patch is applied and committed in that worktree, not in the main checkout (test with a fixture repo and worktree)
- [ ] The applied patch ends up in `gated/applied/` in the main checkout (test)
- [ ] A path that isn't a registered worktree exits 2 and applies nothing (test)
- [ ] With no `--worktree`, behavior is unchanged (existing tests pass)
- [ ] `docs/agents/gated-patches.md` documents the flag

## Comments

- **orchestrator, 2026-10-06:** Filed from the pipeline retro (user yes, 2026-10-06).
- **orchestrator, 2026-10-07:** Parked: User 2026-10-07: north star first (den v1 loop). Pipeline work waits; unpark after den-v1/07 or on a 3rd repeat incident that blocks the relay.
