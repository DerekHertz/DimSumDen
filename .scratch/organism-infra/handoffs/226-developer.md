# 226 developer (batch 226-227)

Branch `feature/organism-infra-226-227-dispatch-capacity`, commit 99d26c0 on qa's tests commit 091fae0. Full `npm test`: 4445 pass, 0 fail. qa's 41 failing tests now pass, unedited.

## State

```json
{
  "ticket": "organism-infra/226-dispatch-capacity-rule",
  "cell": "developer",
  "current_step": "Capacity rule built and wired into the host; every 226 test passes; ADR 0002 and 0016 say 8; committed and released at in-review.",
  "artifacts": [
    "apps/bridge/cells/capacity.mjs (new)",
    "apps/bridge/cells/host.mjs",
    "apps/bridge/cells/policy.mjs",
    "apps/bridge/server.mjs",
    "docs/adr/0002-relay-not-swarm.md",
    "docs/adr/0016-ui-steering-channel.md"
  ],
  "decisions": [
    "capacity() returns refs as one { ref, kind: 'live' | 'lock' } per distinct ref, as qa pinned; a live+locked ref is one 'live' entry.",
    "createHost takes lockedRefs (default returns []); it is read once per admission and in the direct() early check, before the synchronous step. If it throws, the dispatch is refused 503 (fail closed) instead of ignoring the locks.",
    "The 429 text for max is 'max_concurrent_cells (N) reached: <refs>' naming every ref that fills a slot; the session-cap 429 text is unchanged.",
    "The server's checkGate (kept as the host's parameter name) now answers by frontier membership: unknown ref 404, not in the frontier 409 'the ticket is not in the frontier'.",
    "host.capacity(lockedRefs) exposes the same rule with the host's effective max and cap, for the hub (227)."
  ],
  "failures": [],
  "pending": [
    { "item": "Documentation criteria: ADR 0002 and ADR 0016 amendment 14 say 8 (done, no test); check them.", "owner": "qa" },
    { "item": "CLAUDE.md still says max_concurrent_cells: 2; I did not edit it (gated). The orchestrator or user should change it to match.", "owner": "orchestrator" }
  ]
}
```

## Notes

- policy.mjs `MAX_CONCURRENT_AGENTS` is 8; the comment no longer cites CLAUDE.md.
- Tests were not edited.
