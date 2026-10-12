# 232: The host starts the planned hop

**Type:** feature

**Priority:** P1

**Status:** ready-for-agent

**Source:** architect

**Class:** product

**Origin:** added

**Blocked by:** 231

**Serves:** Den loop: the user starts developer, qa or security on a ticket from the den (ADR 0022 decision 1).

## What to build

Slice 1, ticket B of ADR 0022 (`docs/adr/0022-relay-through-the-bridge.md`, accepted by the user 2026-10-12).

1. The `end` row carries `sha` and `branch` (from `workspaces.publish`); replay tolerates rows without them.
2. The workspace module can create a hop's worktree detached at a given base sha, not only at `HEAD`.
3. `POST /agents` for a relay-hop role runs `nextHop` and starts the hop only when `role` and `mode` match the plan; otherwise 409 with the text "the next hop for this ticket is <role> <mode>". The body stays `{ ref, role, mode? }` and no client string reaches argv, the prompt, a base or a branch.
4. A hop prompt: a fixed template over the plan's validated fields (role, mode, ref, handoff name, release flag).
5. Eligibility for a hop is "relay state and no live agent", not the frontier. Capacity, the 90% usage refusal and the single synchronous reservation apply unchanged.

The host may need a `lockedRefs` and `readFacts` parameter; tests pass fakes.

## Acceptance criteria

- [ ] With the fake runtime: a ticket whose plan is `developer` accepts `developer` and refuses `qa` and `security` with 409 naming the planned hop.
- [ ] A developer `end` row with a sha makes the next accepted hop `qa` `verify`, whose worktree base is that sha (asserted on the fake runtime's spawn input).
- [ ] The prompt contains no client string and no handoff text (assert on spawn input).
- [ ] Two concurrent starts of one hop: exactly one starts (the existing double-click test shape).
- [ ] A direct `POST /tasks` agent is unchanged; the 409 for a relay-hop role with no planned hop is unchanged.
- [ ] `npm test` and risk-check green. This touches `apps/bridge/cells/`, so qa specify and full security run.

## Expected files

`apps/bridge/cells/host.mjs`, `apps/bridge/cells/workspace.mjs`, `apps/bridge/server.mjs`, `apps/bridge/cells/policy.mjs` (only if a constant), tests `host-relay-hop.test.mjs`.

## Comments

- 2026-10-12, orchestrator: filed from the architect's draft in `.scratch/organism-infra/handoffs/229-architect.md` after the user accepted ADR 0022. Shares `host.mjs` and `server.mjs` with organism-infra/230's bridge part: do not run the two at once.
