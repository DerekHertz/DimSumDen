```json
{
  "ticket": "organism-infra/28-review-claims-keep-in-review",
  "current_step": "security review: pass",
  "artifacts": [
    "feature/organism-infra-28-review-claims @ b39f990 (merge base e998fd6)"
  ],
  "decisions": [
    "Security pass: no critical/high/medium findings; 2 low/info notes",
    "Real branch diff is e998fd6..b39f990 (2 files: board-service.mjs, board-review-claims.test.mjs); dc959a9..b39f990 shows unrelated reverts only because the branch is based on e998fd6"
  ],
  "failures": [],
  "pending": [
    {
      "item": "ADR 0008 decision 9 and issue-tracker.md wording for keep-in-review claims (brain gate)",
      "owner": "orchestrator"
    },
    {
      "item": "propose merge (brain gate; branch is behind main at dc959a9)",
      "owner": "orchestrator"
    }
  ]
}
```

# 28 security review

Security pass. npm ci clean, npm audit 0 vulnerabilities, no dependency change, npm test 243/243. No secrets in the diff (pattern scan; gitleaks not installed).

## Analysis (focus: abuse of the in-review-preserving claim)

The change is in `claim` only (board-service.mjs:724-728): keepInReview is true only when the ticket is already `in-review` and the caller is `security`, or `qa` with `--mode verify`. Everything else still writes `claimed`.

- Hold a ticket without changing status: possible, but not new. Any cell could already hold any ticket by claiming it (status `claimed`). The lock is still created with `wx` under the write lock, and the fast and authoritative "already claimed" checks are untouched, so lock exclusivity is unchanged. A holder now leaves the ticket visibly `in-review` while locked, so the lock file, not the status, is the "held" signal.
- Spoofing cell or mode: identity is self-declared (ADR 0008 decision 9 states this as a limit). A developer claiming as `security` or `qa --mode verify` gets no capability beyond what it already had: resolve is still orchestrator-only and unforceable (line 838), qa release at in-review still needs mode verify (851), and in-review release still needs a valid State block bound to the ticket (858). The spoof only avoids a `claimed` status flip on an already-in-review ticket, and the event log records the claiming cell and mode.
- Reclaim rules: `reclaim` (753-801) is untouched. It never changes status, so a reclaim of a keep-in-review lock leaves `in-review`, consistent with decision 9 (any existing lock may be taken over; never as orchestrator; reason logged with previous_cell). No bypass.
- Lock and write races: no new file writes. `atomicWrite` of unchanged content on the keep path is harmless. Event `to_status` and the return value reflect the real status.
- Status consumers: no script or app code besides board-service reads `claimed` or `in-review` (grep of apps/ and scripts/), so no mechanical consumer is misled by a locked in-review ticket.
- Path traversal, shell-out, network: not touched.

## Findings

- apps/organism-infra/board-service.mjs:724 - LOW/info - A locked in-review ticket is indistinguishable from an unlocked one by status alone; a dead review-cell lock leaves it `in-review` with a lock. Recoverable via `reclaim` or `release --keep-status`. Not blocking. Orchestrator dispatch should check the lock file, not status, to decide whether a review is in flight.
- apps/organism-infra/board-service.mjs:752 - LOW/info - The reclaim comment "The ticket status stays `claimed`" is now inaccurate for keep-in-review locks. Comment fix only.

jg vs grep: jg 0 calls, grep 3 calls.
