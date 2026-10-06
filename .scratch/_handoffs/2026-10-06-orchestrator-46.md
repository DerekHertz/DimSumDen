# Orchestrator handoff 46 (2026-10-06, WSL): 158 + den-layout/01 approved, not yet dispatched

State, not rules; the genome wins. Active milestone den-v1. Handed off at 69k context before dispatching, so the next session starts small.

## Approved dispatches (user, 2026-10-06), run both now, in parallel (files don't overlap)
1. **organism-infra/158-work-never-one-machine**, qa `specify`, first hop (no `--continue`), isolation worktree. Base main at 756bc53 or newer: `node scripts/cell-start.mjs --base <main sha> --branch tests/158-work-never-one-machine --ticket organism-infra/158-work-never-one-machine --cell qa --mode specify`. Jev advisory: pick qa-specify, conf 0.99; mine qa-specify. dispatch-context: null (secret-in-root), so no start-here line. Gated `.claude/` edit (genome wording for board-only push) goes in the developer's handoff for the user.
2. **den-layout/01-direction-decision**, `architect` (docs only: ADR 0019 amendment + CONTEXT.md terms). Branch e.g. `docs/den-layout-01-direction`. Jev advisory: pick architect, conf 0.39; mine architect. dispatch-context skipped (design). Then risk-check, PR, merge on green.
Log `jev.mjs advisory-outcome` for both when they resolve.

## Decided this session (grilling, user 2026-10-06)
- PR #162 (codex/lively-den-scene-lab, draft) is the target visual interface; stays a draft reference. Built later as feature `den-layout` (spec `.scratch/den-layout/spec.md`, parked) after den-v1 05/06/07. Its CI fails the den-v1/08 reachability test (#458: review modules unreachable from main.jsx) plus its own 3 test files (cause unconfirmed; the job hit a 3m timeout).
- release-manager, knowledge-keeper, docs-writer, stem-cub: planned future roles, scenery for now.
- Cross-machine sync: ticket 158 (release pushes branch; end-of-session check; board-only commits push to main without a gate, genome wording gated). Runs before 145. Board-only push already agreed in principle; I pushed 756bc53 (board only).
- PR #162 review annotations are on the MacBook (local storage): export JSON to `.scratch/den-layout/annotations-<date>.json` when it is back.

## Blocked
- organism-infra/140: tests d92cf29 and dev db9fc50 exist only on the MacBook; user doesn't have it today. Comment on the ticket. Then light verify per handoff 45.

## Frontier after these
145 → 147 → den-v1/02 (designer spec first) → 156 → 146/148/149 → 157. 141/154 wait on 140.

## Owed
- 44 `worktree-agent-*` local branches: worktree-gc / user cleanup.
- Incidents logged: 140 local-only work; scout turn-limit stop on the PR #162 survey (give scouts a tool-call budget).

## Usage
5-hour 5% (resets 2026-10-06 14:10 Pacific), weekly 17%. Context 69k at handoff.
