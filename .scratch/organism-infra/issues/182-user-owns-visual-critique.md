# 182: The user does visual critique; designer only specs, with the user

**Type:** task

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** den-v1/05, 06, 07 (the UI steps of the v1 loop). Designer cells have cost ~2.5M tokens over 24 runs (spec avg 104k, review 95k, direction 147k), and review bounces add whole developer rounds. User, 2026-10-07: "i prefer to do all of the visual critiques given how expensive it is, once we come up with a more efficient system then we can integrate that into the agentic workflow."

## What to build

Change the relay text so it matches the user's decision. These are gated files (`.claude/`, `CLAUDE.md`): the developer writes the exact edit as a script or diff into its handoff, and the user applies it.

- `.claude/agents/orchestrator.md`, the `designer` section of "Code relay": UI tickets get `designer` in `spec` mode before stage 1, run interactively with the user: a very detailed spec plus low-cost visuals (static mockups the user signs off on or annotates). Remove `review` mode between stages 3 and 4; in its place, the ticket goes `ready-for-human` after qa verify, the user critiques, findings go to one developer fix round, and the user's yes unlocks stage 4. Asset tickets: the user critiques in place of `designer` `critique` mode. Note that this stays until a cheaper automated critique exists.
- `.claude/agents/designer.md`: `spec` mode is collaborative with the user and produces low-cost visuals for sign-off; `review` and `critique` modes are off the relay (kept for when the user asks).
- `CLAUDE.md`: the sentence "designer specs and reviews UI tickets and critiques asset tickets" says designer specs UI tickets with the user, and the user does visual critique.

## Acceptance criteria

- [ ] The orchestrator genome no longer dispatches `designer` in `review` or `critique` mode on the relay.
- [ ] A UI ticket's relay reads: designer spec (with the user) → qa specify → developer → qa verify → user visual critique (`ready-for-human`) → risk-check → PR.
- [ ] `designer.md` describes `spec` as collaborative with low-cost visuals for sign-off.
- [ ] `CLAUDE.md` matches.

## Comments

- **Created (orchestrator, 2026-10-07):** From the user's decision in session 5d5ed639. Until it merges, the orchestrator follows the comment on den-v1/05, 06 and 07.
- **orchestrator, 2026-10-07:** User chose the gated-edit method (136 settlement item 9): the developer writes the exact new text for `.claude/agents/orchestrator.md`, `designer.md` and `CLAUDE.md` into its handoff; the user applies it in an interactive session without auto mode. Dispatch on that basis.
