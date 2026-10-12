# 227 qa verify (batch 226-227, light)

QA pass. Branch `feature/organism-infra-226-227-dispatch-capacity`, commit 99d26c0, specify commit 091fae0.

## State

```json
{
  "ticket": "organism-infra/227-snapshot-capacity-and-gate",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done: suite green, no test touched, every criterion mapped, ADR 0011 checked. Verdict pass.",
  "artifacts": [
    "apps/bridge/snapshot.mjs",
    "apps/bridge/watch.mjs",
    "apps/bridge/server.mjs",
    "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md"
  ],
  "decisions": [
    "Suite: /tmp/226-tests.txt shows 4445 pass, 0 fail, 0 skipped (not re-run, per the dispatch). Includes the whole existing suite, which covers 'unknown keys stay ignorable'.",
    "No *.test.mjs file and no capacity-test-helpers.mjs change between 091fae0 and 99d26c0.",
    "Every criterion has a test in 227-qa-specify.md; the ADR criterion is checked below."
  ],
  "failures": [],
  "pending": []
}
```

## ADR 0011 snapshot example (documentation criterion)

docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md: the decision 3 JSON example now has a top-level `capacity` with `max`, `cap`, `load`, `live`, `room` and `refs` as `{ "ref": ..., "kind": "live" | "lock" }` entries (one live, one lock). A `capacity` field rule was added (hub adds it, not `buildSnapshot`; also in the SSE snapshot frame; no change frame), and the gate amendment says 8. Pass.

## Notes

- Files touched outside 227's own list are 226's (host.mjs, capacity.mjs, policy.mjs, ADRs 0002 and 0016), same batch.
- CLAUDE.md still says max 2; gated, listed in the 226 handoff.
