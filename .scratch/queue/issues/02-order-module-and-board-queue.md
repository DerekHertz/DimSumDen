# 02: Order module and `board queue`

**Type:** code

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** none

**Status:** in-review

**Serves:** `.scratch/queue/spec.md` decisions 1, 2, 4 (order), 5, 12, 14; ADR 0015 Amendment 3.

## What to build

`npm run board -- queue` prints the **Queue**: the frontier in its computed order, read only. Design: ADR 0015 Amendment 3 and `.scratch/queue/handoffs/01-architect.md` (Q1).

- A pure order module, `apps/organism-infra/frontier-queue.mjs`, with `loadSnapshot` and `buildQueue`, wired into `apps/organism-infra/board.mjs` as `board queue`.
- Tiers: P0 with a reason, then the active feature, then the rest. Within a tier: unblock count, then P, then ticket number.
- Each ticket prints one reason line and its decay count left. The output also shows the planned and added counts.
- The parked-by-gate list is printed and stays empty until ticket 03.
- It reads the active-feature row. With no row there is no active feature, so the order has one tier fewer.

## Acceptance criteria

- [ ] `buildQueue` orders tickets by tier, then unblock count, then P, then number, tested with literal snapshots.
- [ ] With no active-feature row, `buildQueue` returns the P0 tier and one tier for the rest.
- [ ] Every ticket in the output carries one reason line and a decay-left count.
- [ ] The output shows planned and added counts and an empty parked-by-gate list.
- [ ] One CLI test runs `board queue` against a temp board.
- [ ] `board queue` writes nothing to the board or to `usage.jsonl`.

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q1) on the user's approval of "Seven: Q1 to Q7". User rulings the same day: den-v1 is the active feature; ADR 0019 decision 8 stays; the Class backfill rule is approved.
- **developer, 2026-10-12:** qa test wrong: frontier-queue.test.mjs line 301 expects den-v1 planned 2, but the fixture seed den-v1/09-seed (resolved, no Origin) is planned too, so 3. Impl done at e7bc24f, 12 of 13 green. qa to fix the expectation; no code change needed. See 02-developer.md.
- **developer, 2026-10-12:** qa CLI test expects planned 2 but fixture seed makes it 3; qa to fix test
- **qa, 2026-10-12:** QA pass (light verify, e8aa3dd): saved developer run 4327 pass, 0 fail, 0 skipped; all six criteria map to passing tests. Changed planned count at frontier-queue.test.mjs:302 (2 to 3) rests on the resolved no-Origin reading; see handoff 02-qa-verify.md.
- **orchestrator, 2026-10-12:** user ruling 2026-10-12: a ticket with no Origin line counts as planned, resolved tickets included; merge as built. risk-check hit on frontier-queue.mjs and its test (board code), so full security runs before the PR.
