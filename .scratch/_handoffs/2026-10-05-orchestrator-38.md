# Orchestrator handoff 38 (2026-10-05, WSL): 105 and 08 merged; next is 106

State, not rules; the genome wins. The user wants the den-v1 loop (T/F/A/D). Critical path: 106 → 107, then den-v1 05 (F), 06 (A/D), 07 (T); 02 when a slot is free.

## Done this session
- organism-infra/105 resolved, PR #155. Risk-check hit (shell-out, secrets), full security pass with two low notes: S3 allow phase allows every control_request (could allow only Write); default `--out` dir mode (could be 0700). S5 is already settled per the ticket comments (user saw no separate billing charge: GO, plan usage); handoff 37 wrongly listed it as open.
- den-v1/08 resolved, PR #156. Fix round: qa re-specified the walker (1884c12), developer restored floating-cards.test.mjs (29875f1), qa verify r2 pass, risk-check hit (execFileSync false positive), security pass.
- Advisory-outcome rows logged: 105, 08 (both dispatches), 136.
- worktree-gc applied; no relay worktrees left.

## Owed
- `pipeline-retro` (owed since handoff 36; skipped again to stay under the context gate). Run it first next session. Items: 08 walker bounce; developer cells ending above 80k (105 at 84.6k); jev verify returns `full` on qa-specified tickets (twice on 08); timing flake `apps/organism-infra/board-status-and-lock.test.mjs:159` (2500ms write-lock wait, failed under full-suite load twice, passes alone); qa specify fix round could not release `--status in-review` (used `--keep-status`), so dispatch prompts should say which flag; my dispatch prompts gave ticket paths without `issues/` (incident logged); items from handoff 36.
- Board edits from this session are committed and pushed to main (user, 2026-10-05). Next session runs on the MacBook.
- Leftover harness branches `worktree-agent-*` from the reviewer worktrees may remain; check with `git branch --list 'worktree-agent-*'`.

## User decisions
- packages/character-director: RETIRE (user, 2026-10-05), as a light change, not a full relay: one developer cell direct (no qa specify or verify), then risk-check, PR, merge on green. Scope: delete the package and its tests; give apps/ui/src/scene/scene-from-state.test.mjs (imports only STATES from director.mjs) a live source for its state list; fix prose mentions. The horseshoe layout (banquet-layout.mjs) does not depend on it. It needs a stub board entry for cell-start's claim. Files don't overlap 106, so it can share the second slot.

## User decisions pending
- Stale prose mentions of removed files; 125 (Blender scripts still target apps/ui/public/models).

## Frontier
0. Retire packages/character-director (light change above), alongside 106.
1. organism-infra/106-steering-slice-1: the first hop folds in the ADR 0016 open-questions update (S5 GO plan usage, S6 rerun in a trusted dir) and the two low security notes. Handoff 37: security re-reviews ADR 0016 decision 6 first; size check (may need a split to stay near 120k).
2. 107, then den-v1 05, 06, 07; 02 alongside.

## Usage
5-hour 25% (resets 2026-10-06T02:00Z), weekly 4%. Orchestrator context about 70k at handoff.
