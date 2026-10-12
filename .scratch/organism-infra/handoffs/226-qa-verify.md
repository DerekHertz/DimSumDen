# 226 qa verify (batch 226-227, light)

QA pass. Branch `feature/organism-infra-226-227-dispatch-capacity`, commit 99d26c0, specify commit 091fae0.

## State

```json
{
  "ticket": "organism-infra/226-dispatch-capacity-rule",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done: suite green, no test touched, every criterion mapped, documentation criteria checked. Verdict pass.",
  "artifacts": [
    "apps/bridge/cells/capacity.mjs",
    "apps/bridge/cells/host.mjs",
    "docs/adr/0002-relay-not-swarm.md",
    "docs/adr/0016-ui-steering-channel.md"
  ],
  "decisions": [
    "Suite: /tmp/226-tests.txt shows 4445 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo (not re-run, per the dispatch).",
    "git diff 091fae0 99d26c0 --stat lists no *.test.mjs file and no change to capacity-test-helpers.mjs, so no assertion was removed or loosened.",
    "Every criterion has a test in the specify map (226-qa-specify.md) except the ADR wording, checked by reading below."
  ],
  "failures": [],
  "pending": [
    { "item": "CLAUDE.md still says max_concurrent_cells: 2 (gated, developer did not edit). Orchestrator or user should update it.", "owner": "orchestrator" },
    { "item": "Optional: add a test for the lockedRefs-throws 503 path (gap below).", "owner": "developer" }
  ]
}
```

## Documentation criteria (no test)

- ADR 0002: says eight, amended 2026-10-12, never above the 8-session cap. Pass.
- ADR 0016 amendment 14: item 2 says "default 8"; item 4 example is "8 of 8 running"; the decision 3 concurrency bullet says 8. Pass.
- ADR 0011 decision 3: covered in the 227 handoff (capacity example key, pinned shape, "8" in the gate amendment).

## lockedRefs throws: fail closed? Yes, with one small caveat

`apps/bridge/cells/host.mjs:201-209` (`readLocked`) wraps `await lockedRefs()` in try/catch. On a throw it logs to stderr and returns `null`; both callers (`admit` at line 235-236, `direct` at line 307-308) turn `null` into `refuse(503, "could not read the board's claim locks")` before the synchronous reservation, so nothing is reserved, no ticket is created in `direct`, and no agent starts. That is fail closed as described, on all three entries (dispatch, start, direct all go through `admit` or `direct`).

Caveat: a `lockedRefs` that returns a non-array (for example undefined) is treated as `[]` (line 205), which fails open for that malformed return. The bridge's own `lockedRefs` (server.mjs) always returns an array, so this is not reachable today.

Gap: no test pins the 503 path. I recommend one small test in host-capacity.test.mjs (lockedRefs rejects -> 503, no agent, `direct` writes no ticket). Not blocking; I did not add one.

## Out of scope files

The diff 091fae0..99d26c0 touches `apps/bridge/snapshot.mjs`, `watch.mjs` and ADR 0011, which belong to 227 (same batch). Nothing else outside the batch.
