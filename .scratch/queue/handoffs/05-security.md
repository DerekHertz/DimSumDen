# Handoff: security, queue/05-decay-pick-and-unplanned-cap

Verdict: Security pass at 5ed03a21b328 (branch tests/queue-05-decay-pick-and-unplanned-cap).

## State

```json
{
  "ticket": "queue/05-decay-pick-and-unplanned-cap",
  "cell": "security",
  "current_step": "Security review done at 5ed03a21b328: pass, no critical or high findings. Ready for the orchestrator to open the PR.",
  "artifacts": [
    "apps/organism-infra/board.mjs",
    "apps/organism-infra/frontier-queue.mjs",
    "apps/organism-infra/queue-decay.test.mjs"
  ],
  "decisions": [
    "board pick validates the ref through getStatus/prepare (parseTicketRef) before any write, so no path traversal; unknown refs write nothing.",
    "board pick writes one JSON.stringify row via appendUsageLine (O_APPEND, O_NOFOLLOW); --deviation text is JSON-escaped and length-capped by checkArgLength, so no log injection or unbounded write.",
    "No shell, network, or daemon changes; no new dependencies, package files, or .github changes.",
    "gitleaks detect over origin/main..5ed03a2 (3 commits): no leaks."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Open the PR and merge on green CI.",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings

None at critical or high. Low, non-blocking:

- apps/organism-infra/board.mjs:208-221 (low): `board pick` does a read-then-append of usage.jsonl with no lock; the "top" field can be stale if the queue changes between the read and write. It is advisory telemetry only, and the append itself is atomic (O_APPEND), so no corruption.
- apps/organism-infra/frontier-queue.mjs:236-248 (low): `gateRefusals` calls `buildQueue` again, so the snapshot is computed twice. It is performance only, not a security issue.

## Comments

Security pass.
