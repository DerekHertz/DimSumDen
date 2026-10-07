# 171: The context hook allows `context.mjs --self --cell <type>` past the stop threshold

**Type:** bug

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** Context budget (organism-infra/145). Security low from `.scratch/organism-infra/handoffs/145-security.md`: organism-protocol now tells cells to run `node scripts/context.mjs --self --cell <type>` at stage boundaries, but the wrap-up allowlist in `scripts/hooks/context-budget.mjs` only matches `node scripts/context.mjs` with an optional `--self`. Past the stop threshold, the documented check is refused (user yes, 2026-10-06).

## What to build

At or past the stop threshold, let the hook allow `node scripts/context.mjs --self --cell <type>`, where `<type>` is a known cell type (`/^[a-z-]+$/` is enough), in either flag order. Every other chain or argument rule stays as it is.

Files: `scripts/hooks/context-budget.mjs` and its tests.

## Acceptance criteria

- [ ] Past the stop threshold, `node scripts/context.mjs --self --cell developer` is allowed, and so is `--cell developer --self` (test)
- [ ] `--cell` with a value that fails the pattern, or a chained command after it, is still refused (test)
- [ ] The existing 162, 145 and 165 hook tests still pass

## Comments

- **orchestrator, 2026-10-06:** Filed from the pipeline retro (user yes, 2026-10-06).
- **orchestrator, 2026-10-07:** Parked: User 2026-10-07: north star first (den v1 loop). Pipeline work waits; unpark after den-v1/07 or on a 3rd repeat incident that blocks the relay.
