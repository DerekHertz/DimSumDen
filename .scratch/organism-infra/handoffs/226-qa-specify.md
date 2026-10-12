# 226 qa specify (batch 226-227)

Branch `tests/organism-infra-226-227-dispatch-capacity`, commit 091fae0bc5ab8aab40f64b5575a7f3dfad82bd6c, on base 730cfc38. One branch covers 226 and 227.

## State

```json
{
  "ticket": "organism-infra/226-dispatch-capacity-rule",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed for every testable 226 criterion; 41 tests fail across the batch, all for the missing feature, and the other 4404 pass.",
  "artifacts": [
    "apps/bridge/cells/capacity.test.mjs",
    "apps/bridge/cells/host-capacity.test.mjs",
    "apps/bridge/cells/capacity-test-helpers.mjs",
    "apps/bridge/cells/host-core.test.mjs (updated)",
    "apps/bridge/cells/host-task.test.mjs (updated)"
  ],
  "decisions": [
    "capacity().refs shape is qa's pin: one { ref, kind } per distinct load ref, kind 'live' when the ref is in liveRefs (a host agent that also holds its lock is one 'live' entry), else 'lock'; order not pinned. ADR 0016 amendment 14 says only that refs tells a live agent from a lock. If the architect wants another shape, change capacity-test-helpers.mjs (kinds helper) and the capacity tests together.",
    "Locks are simulated with .lock files beside fixture tickets; max 2 is injected through startBridge policy.maxConcurrent.",
    "Existing tests that assumed cap 2 or the single-gate rule were updated, not weakened: host-core (default max 8; max 2 injected in 3 cap tests and the start() test; 'no dispatch gate' 409 test became 'not in the frontier'), host-task (max 2 injected)."
  ],
  "failures": [],
  "pending": [
    { "item": "Make the 41 failing tests pass: capacity.mjs, createHost lockedRefs, frontier eligibility in server.mjs, MAX_CONCURRENT_AGENTS 8, ADR 0002 / 0011 / 0016 wording. Do not edit CLAUDE.md or .claude/.", "owner": "developer" },
    { "item": "Documentation criterion checks (no test): ADR 0002, ADR 0011 decision 3 and ADR 0016 amendment 14 say 8 where they said 2 for the cap.", "owner": "qa verify" }
  ]
}
```

## Criterion to test map (226)

| Criterion | Test (file: name) |
|---|---|
| POST /agents for the 2nd and 3rd frontier ticket starts an agent while room > 0; first ticket need not hold the gate | host-capacity.test.mjs: "any frontier ticket starts: the second and third need no dispatch gate, and the first need not go first" |
| one live + one foreign lock -> 429 naming both refs | host-capacity.test.mjs: "one live agent and one foreign lock ... a dispatch is 429 and the text names both refs" |
| two live host agents -> 429 | host-capacity.test.mjs: "two live host agents ... 429 naming both"; also "an ended agent frees its slot" |
| host agent that claimed its own ticket counts once | host-capacity.test.mjs: "a host agent that has claimed its own ticket counts once, not twice"; capacity.test.mjs: "a host agent that claimed its own ticket counts once" |
| outside frontier 409 "not in the frontier"; unknown 404; live agent 409; relay-hop roles 409 | host-capacity.test.mjs "eligibility: ..." (4 tests) and "a live agent keeps its ticket ..."; host-core.test.mjs "a ref that is not on the board is 404; a ticket outside the frontier is 409" (updated); host-core.test.mjs relay-hop tests (unchanged) |
| two dispatches at one free slot start one agent | host-capacity.test.mjs: "two dispatches for different tickets fired at one free slot start one agent" and "a dispatch racing start() ... foreign lock held"; host-core.test.mjs race tests (unchanged apart from max 2 injected) |
| 8-session cap still applies when an override raises max | host-core.test.mjs "the 8-session cap is a hard ceiling ..." (unchanged); capacity.test.mjs cap rows |
| default max is 8 | host-core.test.mjs "the caps, the grace and the relay-hop roles ..." (now asserts 8); bridge-capacity.test.mjs "the default max is 8 ..." |
| ADR 0002, ADR 0011 decision 3, ADR 0016 amendment 14 say 8 | documentation: qa verify checks, no test |
| capacity has table tests; existing 409-for-no-gate tests updated | capacity.test.mjs (13 table rows plus refs and purity tests); host-core.test.mjs update above |

Also covered (build items 2 and 4, not criteria): createHost takes `lockedRefs` and reads it at each admission (host-capacity.test.mjs "lockedRefs is read at each admission ..."); start() and POST /tasks use the same rule, and a refused task writes no ticket.

## For verify

Failing before the developer (41 in the batch): capacity.test.mjs 15 (capacity.mjs missing); host-capacity.test.mjs 12 (409 from the gate instead of 201 or 429, locks ignored, lockedRefs not a parameter); host-core.test.mjs 2 (default max still 2; no "not in the frontier" text). The other 12 are 227's: bridge-capacity.test.mjs 11 and bridge-state.test.mjs 1 (see its handoff).
