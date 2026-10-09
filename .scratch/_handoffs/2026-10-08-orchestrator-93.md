# Orchestrator handoff 93 (2026-10-08)

## State
- **organism-infra/212 resolved** (PR #208, merge eca612f): `scripts/queue.mjs`, `mods/queue/` band, `npm run queue`, and `/queue` plus the `queue@dimsumden-mods` plugin enable, applied by the user from a gated patch. Relay: qa specify (31 tests), developer (Sonnet), qa light verify on Haiku (pass), risk-check 8 hits, full security pass. Two low security notes in 212-security.md: ticket titles and lock text reach the terminal without control-character filtering, and the mod runs the cwd-relative `scripts/queue.mjs`, as north-star does. File a follow-up only if the user wants them closed.
- User checked the band from the worktree: the next-up line and `/queue` work. The in-flight line was empty because the worktree's `.scratch` copy was stale. From the main checkout, 212 shows in flight. **Confirm the band's in-flight line from the main checkout on the next live relay.**
- Advisory outcome logged (qa-specify / Jev other / qa-specify, no bounce). Worktrees GC'd; only the main checkout remains. About 20 old `worktree-agent-*` branches are left locally (GC doesn't list them); ask the user before pruning.
- **Retro** (row logged): new ticket **214** (apply-gated `--yes` for `!` mode and `--branch` to target a worktree, P2). Stale `136-jev-go-live-genome.patch` retired to `gated/applied/*.stale`.
- Gated-patch workaround until 214 lands: move the patch into the developer's worktree `.scratch/_handoffs/gated/`, symlink `/tmp/wt<NN>`, and have the user run `! cd /tmp/wt<NN> && echo y | npm run apply-gated`. The auto-mode classifier blocks the orchestrator from applying it even with the user's chat permission.

## Next (fresh session per ticket)
1. **Dashboard** feature: dispatch `product` for a spec (Den kanban plus mod version; efficiency, quality, token economics; economics depends on 211), then `designer` spec interactively with the user (terminal, not the Agent tool).
2. Then 211 → den-v1/09 → 106 → 107 → den-v1/10 → den-v1/11; 213 and 214 when convenient (both small infra; batch candidates).
3. Weekly usage 86%: warn before expensive cells.
