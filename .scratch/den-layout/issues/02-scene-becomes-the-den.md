# 02: PR #162's scene becomes the den

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** den-layout spec "Wiring decisions" (user, 2026-10-06): PR #162's scene replaces the live den. ADR 0019 amendment 1.

## What to build

Opening the app shows PR #162's restaurant scene (the signed-off site plan, stations, leisure areas, build pads, pandas) in place of the current den. Port the PR #162 scene and review modules (branch `codex/lively-den-scene-lab`: `apps/ui/src/scene/procedural/`, `apps/ui/src/review/`) onto `main` and mount them from `apps/ui/src/main.jsx`, replacing the current renderer. Drop the standalone review build (`review:dev`, `review:build` and its vite config). Pandas stay simulated in this ticket; real agents come in 03.

PR #162's CI fails the den-v1/08 reachability test (review modules unreachable from `main.jsx`) and its own `apps/ui/src/review/agents.test.mjs`, `apps/ui/src/review/review.test.mjs` and `apps/ui/src/scene/procedural/restaurant.test.mjs` (cause unconfirmed; the job hit a 3-minute timeout). This ticket makes all of them pass. Kept as one ticket because the reachability test only passes once the whole scene is mounted.

No designer spec or review: the user signed off PR #162's visuals (user, 2026-10-06). Keep the visuals as PR #162 has them.

## Acceptance criteria

- [ ] `npm run ui` opens PR #162's scene as the den, and no code path renders the old den scene
- [ ] `review:dev`, `review:build` and the review vite config are gone; `package.json` scripts reference no removed file
- [ ] The den-v1/08 reachability test passes with the ported modules
- [ ] PR #162's three test files pass on `main` within CI's time limit
- [ ] `npm test` and `npm run smoke:ui` pass

## Comments

- **orchestrator, 2026-10-06:** Published from the approved breakdown (user, 2026-10-06). No designer on this ticket (user override).
