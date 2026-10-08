# 10: A/D wired to the live runtime

**Type:** feature

**Priority:** P1

**Blocked by:** organism-infra/106, den-v1/06

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 and user story 22 (the agent continues after I answer, and its panda shows it).

## What to build

Connect den-v1/06's A/D card (built against a stub) to the real approval hold from organism-infra/106. A real pending permission request from a running cell appears on its panda's card; allow lets the cell continue and deny refuses, and the panda's state changes to show it.

## Acceptance criteria

- [ ] With the live runtime, a real pending approval appears on the right panda's card with its tool input (end-to-end test or recorded smoke).
- [ ] Allow lets the cell continue and the panda's state leaves "waiting on me"; deny refuses and the panda shows it.
- [ ] Every request carries the bridge token (story 23).
- [ ] `npm test` is green.

## Comments
- **orchestrator, 2026-10-08:** Split from den-v1/06 on the user's yes: 06 builds the UI against a stub now; this ticket is the live wiring.
