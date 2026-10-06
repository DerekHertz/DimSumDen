# 163: Bridge emits cells[] tool data

**Type:** feature

**Priority:** P2

**Blocked by:** 140

**Status:** needs-design

**Serves:** den-layout/03 and den-v1/02 (tool-call bubble): live pandas' bubbles show the agent's latest tool. 03 consumes `snapshot.cells[]` (ADR 0016 decision 4: ref, state, lastEventAt, `tool{name,summary}`) but the bridge does not emit it yet, so live bubbles stay empty.

## What to build

The bridge's `/state` snapshot carries `cells[]` per ADR 0016 decision 4, with each live cell's latest tool call, so the den's bubbles show real tools. Open design question for `architect` first: where the tool events come from. Cells dispatched through the Agent tool are not run by the bridge, so it needs a feed (for example a hook that appends events, or reading session transcripts). Check what 140's steering host already provides before designing anything new.

## Acceptance criteria

- [ ] Design settled (architect handoff or ADR 0016 amendment): the tool-event source for both bridge-run and Agent-tool cells
- [ ] `/state` includes `cells[]` with ref, state, lastEventAt and `tool{name,summary}` for each live cell (bridge test)
- [ ] With a live cell making a tool call, the den shows it in that panda's bubble (bridge-fixture or smoke test)
- [ ] `npm test` and `npm run smoke:ui` pass

## Comments

- **orchestrator, 2026-10-06:** Split out of den-layout/03 (user, 2026-10-06: separate is fine). Blocked by 140 because 140 owns the steering host and its `cells[]` shape; check its branches once they are pushed from the MacBook.
