# 227 developer (batch 226-227)

Branch `feature/organism-infra-226-227-dispatch-capacity`, commit 99d26c0 (same commit as 226). Full `npm test`: 4445 pass, 0 fail.

## State

```json
{
  "ticket": "organism-infra/227-snapshot-capacity-and-gate",
  "cell": "developer",
  "current_step": "The dispatch gate no longer depends on locks and the hub adds capacity to GET /state and the SSE snapshot; all 227 tests pass; ADR 0011 updated; committed and released at in-review.",
  "artifacts": [
    "apps/bridge/snapshot.mjs",
    "apps/bridge/watch.mjs",
    "apps/bridge/server.mjs",
    "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md"
  ],
  "decisions": [
    "snapshot.mjs: the anyLock clause is dropped, so frontier[0] always gets gate 'dispatch'. Merge gates are unchanged.",
    "capacity is added by the hub (createHub option capacity(lockedRefs)), not by buildSnapshot, in snapshot(); it is built from host.capacity with the holders of the snapshot being served, so GET /state and the SSE snapshot frame carry the same value.",
    "max and cap are the host's effective values (min of policy and 8), so the Run buttons and the host agree.",
    "No change frame carries capacity; diff() is untouched. A UI that wants live updates between snapshots recomputes it (ADR 0016 amendment 14 item 4)."
  ],
  "failures": [],
  "pending": [
    { "item": "Documentation criterion: ADR 0011 decision 3 gains a capacity example key (with the pinned shape) and a field rule, and says 8 where it said 2 (done, no test); check it.", "owner": "qa" }
  ]
}
```
