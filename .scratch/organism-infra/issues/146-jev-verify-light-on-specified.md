# 146: jev verify picks light on qa-specified tickets

**Type:** bug

**Priority:** P2

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Testbed friction: verify mode is wrong in shadow logs, so Jev's verify accuracy data is skewed and light verify can't go live.

## What to build

The relay rule is light verify when qa ran `specify` for the ticket, and full otherwise. `node scripts/jev.mjs verify --ticket <ref> --tests <file>` returned `effective: full` on qa-specified tickets three times (den-v1/08 twice, organism-infra/124). Its baseline rule should look for a qa specify handoff for the ticket (`.scratch/<feature>/handoffs/<NN>-qa-specify*.md`, or a State block with `cell: qa, mode: specify`) and pick light when one exists. Split out of parked 136 (Jev go-live amendment); the previous retro's fix pointed at a go-live ticket that was never filed.

## Acceptance criteria

- [ ] With a qa specify handoff present, the baseline and shadow `effective` are `light` (test with a fixture board)
- [ ] With none, it stays `full` (test)
- [ ] A fix-round specify handoff (`-r2`) also counts (test)

## Comments

- **orchestrator, 2026-10-05:** Filed from pipeline-retro (user yes 2026-10-05). Incidents: 08 ×2 (handoff 38), 124 (usage.jsonl).
- **orchestrator, 2026-10-07:** Pipeline retro 2026-10-07: shadow verify effective=full after qa specify has hit 3 tickets (158, den-layout/04, 140) and forced one full verify. The user approved running it next, right after batch D.
