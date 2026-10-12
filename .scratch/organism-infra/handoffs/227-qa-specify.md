# 227 qa specify (batch 226-227)

Branch `tests/organism-infra-226-227-dispatch-capacity`, commit 091fae0bc5ab8aab40f64b5575a7f3dfad82bd6c, on base 730cfc38. Same branch as 226; 227 builds on `capacity()` from 226.

## State

```json
{
  "ticket": "organism-infra/227-snapshot-capacity-and-gate",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed for every testable 227 criterion; they fail because the snapshot has no capacity key and the dispatch gate still depends on locks.",
  "artifacts": [
    "apps/bridge/bridge-capacity.test.mjs",
    "apps/bridge/bridge-state.test.mjs (updated)",
    "apps/bridge/cells/capacity-test-helpers.mjs (shared with 226)"
  ],
  "decisions": [
    "The hub reports the host's effective values: capacity.max and capacity.cap are min(policy override, 8), so Run buttons and the host cannot disagree (a test pins max 100 -> 8 and sessionCap 3 -> cap 3).",
    "Ended agents and released locks do not count: capacity.live counts live host agents only, not the history in the snapshot's agents array.",
    "capacity.refs uses the { ref, kind: 'live' | 'lock' } shape pinned in the 226 handoff (ADR is silent on the shape)."
  ],
  "failures": [],
  "pending": [
    { "item": "Make the 227 tests pass: snapshot.mjs gate rule (drop anyLock), hub adds top-level capacity to GET /state and the SSE snapshot, built with capacity() from 226. Not in buildSnapshot (ADR 0011: the hub adds it with the agents).", "owner": "developer" },
    { "item": "Documentation criterion check (no test): the ADR 0011 snapshot example gains the capacity key.", "owner": "qa verify" },
    { "item": "Acceptance criterion 'unknown keys stay ignorable': run the whole existing suite; no new test beyond the envelope check.", "owner": "qa verify" }
  ]
}
```

## Criterion to test map (227)

| Criterion | Test (file: name) |
|---|---|
| one ticket locked, two ready: frontier[0] of the unlocked tickets has gate "dispatch" | bridge-capacity.test.mjs: "the dispatch gate goes to frontier[0] while another ticket is locked, and to no other ticket"; bridge-state.test.mjs: "holder parsed from the lock; ... frontier[0] keeps the dispatch gate" (updated) |
| no other ticket gets a dispatch gate; merge gates unchanged | same two tests (merge gate on 04-review asserted in both); bridge-capacity.test.mjs: "with every ready ticket locked ... no ticket has a dispatch gate" |
| GET /state and SSE snapshot carry capacity with max, cap, load, live, room, refs; room 0 at max (max 2 injected: two live, or one live plus one foreign lock); refs tells live from lock | bridge-capacity.test.mjs "capacity in GET /state (max 2 injected)" (7 tests: empty, default 8 and override limits, two live, live plus lock, claimed host agent counted once, ended agent and released lock, room agrees with the host's 429) and "capacity in the SSE snapshot" |
| unknown keys stay ignorable (existing consumer tests pass) | bridge-capacity.test.mjs: "the snapshot keeps its envelope and existing keys beside capacity" (schema 1, existing keys present); plus the whole existing suite, which qa verify runs |
| ADR 0011 snapshot example gains the capacity key | documentation: qa verify check, no test |
| (build item 3) POST /requests rule unchanged | bridge-capacity.test.mjs: "POST /requests keeps its rule ..." (dispatch-approve on frontier[0] under a lock is 201, on another frontier ticket 409) |
