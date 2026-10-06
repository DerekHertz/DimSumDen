# Orchestrator handoff 47 (2026-10-06, WSL): den-layout/01 merged, 158 at qa verify, den-layout 02-04 awaiting approval

State, not rules; the genome wins. Handed off at 82.7k context (over the 80k gate). Usage 5h 18%, weekly 19%.

## Done this session
- den-layout/01 resolved: PR #163 merged (97ee042). ADR 0019 amendment 1 now says den-layout runs alongside den-v1, PR #162 layout approved as-is, no designer pass. Advisory outcome logged.
- 158: qa specify 80d1d9b (tests/158 pushed); developer 9a86ebb on `158-work-never-one-machine` (pushed), 2023/2023 pass. Handoff `.scratch/organism-infra/handoffs/158-developer.md`. User decisions on qa's open points are in the ticket's Comments.

## In flight: 158, next step qa verify (light, Agent model haiku: ticket 40 resolved)
1. User applies the gated patch in the dev worktree first: `! cd /home/dhertzell/dimsumden/.claude/worktrees/agent-a0c0c4043a3a0e2ac && npm run apply-gated -- --root $PWD` — answer `y` to 158-board-only-push-and-session-check.patch, `n` to 136-jev-go-live-genome.patch (stale tracked copy). Confirm the commit landed on `158-work-never-one-machine`, push it.
2. Re-save tests if the patch commit changed anything, then `node scripts/jev.mjs verify --ticket organism-infra/158-work-never-one-machine --tests <file>` (dev test output was saved to the session scratchpad `158-tests.txt`; regenerate if gone).
3. qa verify: `node scripts/cell-start.mjs --base <dev head sha> --detach --ticket organism-infra/158-work-never-one-machine --cell qa --mode verify --continue`. Then risk-check (scout), PR, merge on green, resolve, advisory-outcome (orch qa-specify, jev qa-specify, user qa-specify, bounced per verify).
- Developer note: it chose to check `.scratch/<feature>/` and `.scratch/_handoffs/` and skip other underscore dirs in session-check (not in ticket); qa verify should judge it.

## Awaiting user approval: den-layout breakdown (draft, not published)
Decisions recorded in `.scratch/den-layout/spec.md` "Wiring decisions".
- **02 PR #162's scene becomes the den** (blocked by none): port PR #162 scene + review modules onto main, mount in `main.jsx` replacing current renderer, drop `review:dev`/`review:build`/review vite config, reachability test passes, fix PR's 3 failing tests (`apps/ui/src/review/agents.test.mjs`, `review.test.mjs`, `apps/ui/src/scene/procedural/restaurant.test.mjs`). Pandas still simulated.
- **03 Real agents drive the pandas** (blocked by 02): pure adapter sceneFromState → PR #162 actor shape (`apps/ui/src/review/agents.mjs` line ~76), fed at `createReviewAgents(..., {onChange})` in `apps/ui/src/scene/procedural/SceneLab.jsx`; live state from `apps/ui/src/state/live-store.mjs`. Bound = at station, real state, bubble = latest tool, task = ticket; split-off for 2nd agent; unbound wander leisure; 4 scenery simulated.
- **04 Walk mode in the new den** (blocked by 02): den-v1/03 walk mode with PR #162 site-plan obstacles (`apps/ui/src/review/site-plan.mjs`).
- den-v1 05/06/07 get blocked by den-layout 03; den-v1 04 by den-layout 03 and 04.
- No designer spec/review on these (user override); note it on each ticket. 02 is a big port; kept whole because of the reachability test.

## Frontier after
den-layout 02 → 03 (+04 alongside) → den-v1 04-07; 145 → 147 → 156 → 146/148/149 → 157. 140 blocked on MacBook push.

## Owed
- worktree-gc (den-layout/01 merged; ~44 stale worktree-agent-* branches). Worktrees: ac45 (detached, clean), a84e (den-layout/01 merged, clean), ac35 (tests/158, clean), a0c0 (158 dev).
- Incidents logged: dispatch prompt named wrong handoff path; scout turn-limit (2nd time) with proposed rule change (hard call budget, ≤3 questions per scout).
- pipeline-retro not yet run this session (1 ticket resolved).
