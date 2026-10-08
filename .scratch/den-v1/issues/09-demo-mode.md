# 09: Demo mode: walk the den and its cards on recorded fixture events

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately; den-v1/01-04 resolved)

**Status:** ready-for-agent

**Serves:** Den v1 user story 25 (Demo mode), the showcase: a den you can show others with no live agents and no steering runtime.

## What to build

A recorded fixture event stream checked into the repo, and a Demo mode that replays it into the den. Walk mode and the proximity card then work as they do live: resident and split-off pandas, state changes, tool-call bubbles, a panda waiting on the user, and a message acknowledgement. Every steering action on the card (T, F, A, D) is shown greyed out with the reason "Demo mode". Demo mode is entered from a control and a URL parameter (for example `?demo=den`), the replay loops, and Demo mode makes no request to any steering route.

The look of the entry control, the Demo mode indicator and the greyed actions comes from a designer `spec` session with the user (very detailed spec plus low-cost mockups the user signs off on) before qa specify.

Today, `?demo=handoff` (`apps/ui/src/handoff-state.js`, `apps/ui/src/scene/handoff-fixture.mjs`) plays a scripted handoff only. `apps/bridge/bridge-fixture.mjs` is a state snapshot for tests. No recorded agent event stream exists yet.

## Acceptance criteria

- [ ] A fixture event stream (at least two roles, one split-off panda, tool calls, one pending approval and one message acknowledgement) lives in the repo, with a short note on how to re-record it.
- [ ] Demo mode replays the fixture into the den in a loop; pandas take over, change state and show bubbles as the events dictate (test on the replay driver).
- [ ] In Demo mode, walk mode and the card work, and T, F, A and D are greyed out with the reason "Demo mode" (test).
- [ ] Demo mode makes no request to any steering route and needs no bridge token (test).
- [ ] Entering and leaving Demo mode works from the control and from the URL parameter.
- [ ] The user signs off the visual critique (`ready-for-human`) before risk-check.
- [ ] `npm test` is green.

## Comments
- **orchestrator, 2026-10-08:** Filed on the user's yes. Story 25 had no ticket; this is the shortest path to a showable den, independent of the runtime chain (202, 143, 106, 107). UI ticket: designer spec with the user first; never batched.
