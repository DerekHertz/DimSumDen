# Handoff: den-layout/01 architect (fix round)

Fix round done. Branch `docs/den-layout-01-direction`, new commit `91ebdc9` on top of `dc872d7`. Not pushed.

The user reversed the first pass: den-layout is active alongside den-v1, not queued behind 05/06/07, and has no designer pass. I rewrote ADR 0019 Amendment 1 and the Status line pointer in `docs/adr/0019-refocus.md` to record:
- Decision 8 relaxed for den-layout and den-v1 only (still one-at-a-time for a third); other decision 8 guardrails apply.
- Decision 7's layout freeze lifted for the PR #162 site plan only; Blender-out and procedural three.js unchanged. PR #162 stays an open draft, nothing merges until den-layout tickets are filed.
- No designer pass or mockup step; remaining work is connecting real agents (bridge) to the front end; tickets via scout survey and /to-tickets; annotations not needed.
- Scenery roles bullet kept; decision 6 unchanged.

The "after 05/06/07" sequencing and the "designer direction mode first" sentence are gone. CONTEXT.md unchanged: the three terms (leisure area, build pad, scenery panda) still hold and none mentions sequencing.

`npm test`: 1995 pass, 0 fail.

```json
{
  "ticket": "den-layout/01-direction-decision",
  "cell": "architect",
  "current_step": "ADR 0019 Amendment 1 revised to the user's current decision (active alongside den-v1, PR #162 layout approved, no designer pass); committed 91ebdc9 on docs/den-layout-01-direction; npm test green",
  "artifacts": [
    {"path": "docs/adr/0019-refocus.md", "note": "Amendment 1 rewritten, Status line updated"}
  ],
  "decisions": [
    "Decision 8 is relaxed only for den-layout plus den-v1, not repealed",
    "Decision 7's freeze is lifted only for the PR #162 layout"
  ],
  "failures": [],
  "pending": [
    {"item": "Open PR for docs/den-layout-01-direction, merge on green CI, then resolve den-layout/01; file den-layout tickets via scout survey and /to-tickets", "owner": "orchestrator"}
  ]
}
```
