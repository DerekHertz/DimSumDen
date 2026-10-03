# 116: Trim the genomes, organism-protocol and skill descriptions

**Type:** chore

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

## What to build

The always-loaded path carries repeated rules. `orchestrator.md` (2,922 words, loaded every orchestrator turn) restates the code relay in its Code relay section (~674 words) that `organism-protocol` and `CLAUDE.md` already state. `organism-protocol` (1,577 words, every cell) carries pass-gate detail only pass cells use, and repeats the handoff State block the `handoff` skill owns. The 22 skill descriptions (718 words, every session) run long. Repeated rules drift: on 2026-10-02 an orchestrator dispatch prompt contradicted `organism-protocol` on publishing handoffs.

- Replace the orchestrator's Code relay section with a pointer to `organism-protocol`, keeping only orchestrator-only steps (dispatch, risk-check, PR, merge, status).
- Move pass-gate detail from `organism-protocol` into the genomes that make those calls (orchestrator, product, architect).
- Make the `handoff` skill the only definition of the State block; `organism-protocol` links to it.
- Cut each skill description to one sentence.
- `wayfinder` and `writing-for-agents`: set `disable-model-invocation: true` so their descriptions leave the context but `/wayfinder` and `/writing-for-agents` still work. Keep `automate-me` (user uses it).
- Add a test with a word budget for the always-loaded files (each genome, `organism-protocol`, `CLAUDE.md`, the sum of skill descriptions) set at the trimmed sizes, so they can't creep back.

Files: the budget test under `scripts/` (+ test); gated: `.claude/agents/*.md`, `.claude/skills/*/SKILL.md` (ship as patches in `.scratch/_handoffs/gated/`, applied with `npm run apply-gated`).

## Acceptance criteria

- [ ] `orchestrator.md` and `organism-protocol` shrink by at least 600 words combined with no rule lost (the handoff maps each removed paragraph to where it now lives)
- [ ] The State block is defined only in the `handoff` skill
- [ ] Every skill description is one sentence; `wayfinder` and `writing-for-agents` are not model-invoked
- [ ] The word-budget test fails when a budgeted file grows past its budget
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed from the agent/skill audit, user yes 2026-10-02. Keep automate-me; the user rarely uses wayfinder and writing-for-agents.
- **orchestrator, 2026-10-03:** Refocus (ADR 0019 decisions 4 and 10): the trim also rewrites the role files and the protocol skill in the new vocabulary (SWE terms; mapping in organism-infra/90), so each file is rewritten once, as one gated patch; and it encodes the slim relay default (developer test-first + light verify; qa specify and full security only on a risk-check hit or board locking/security code) and drops the hand-written usage/context/incident/advisory rows.
