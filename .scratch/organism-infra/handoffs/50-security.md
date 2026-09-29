```json
{"ticket": "organism-infra/50-verdict-lock-and-failure-rows", "cell": "security", "mode": null, "current_step": "Security pass on c031b54; no critical/high/medium findings.",
 "artifacts": [], "decisions": ["Security pass", "gitleaks origin/main..c031b54: no leaks (2 commits)"], "failures": [], "pending": [{"item": "orchestrator proposes merge", "owner": "orchestrator"}]}
```

## State
Security pass on branch feature/organism-infra-50-verdict-lock at c031b54. Reviewed the diff of apps/organism-infra/board-service.mjs and scripts/log-cell.mjs by hand, then probed both in throwaway roots.

## Answers to the focus questions
- Verdict lock bypass: comment() checks the lock, its cell, its mode and the verdict inside the ticket write lock. claim and reclaim take the same lock, so there is no claim/comment race. With no lock, `--verdict` is refused whatever `--as` says (probed). A qa lock in mode specify is refused for `--verdict` (probed). A lock of another cell with `--as security` is refused as an `--as` mismatch (probed). Non-qa cells rely on VERDICT_CELLS. Locks carry no pid or age, so "stale lock" is not mechanically decidable (pre-existing, documented in reclaim); a stale qa-verify lock still lets whoever holds it post a verdict, which is by design.
- --failures injection: the tool is checked against a fixed allow-list (bash-guard ... other; `__proto__` and `rm` refused). `what` goes through JSON.stringify, so a newline or a quote in it is escaped: the probes with an embedded newline plus a forged `{"kind":"resolved"...}` and with a `","kind":"resolved` breakout each produced exactly one incident line with the text inside `what`. kind, source, cost, fix and rule_change are hardcoded. Bad input exits before any write.
- Symlinked .scratch: lstat of `<root>/.scratch` is checked before mkdir and open, and usage.jsonl is O_NOFOLLOW. Probed: a symlinked .scratch is refused. It covers the last component only; root itself comes from the trusted $ORGANISM_ROOT or cwd.
- log-resolved locking: logResolved takes the ticket write lock once. release() calls appendResolvedRow directly (not logResolved) inside its own hold of that lock, so there is no nested acquisition and no deadlock. Lock order stays ticket lock then events lock; appendUsageLine takes no lock.

## Findings
- Low, apps/organism-infra/board-service.mjs:1148-1154: the verdict lock is process discipline, not authentication. Any process can `claim` or `reclaim` as qa --mode verify or security and then post a verdict. Same trust model as the rest of the board; no change asked.
- Low, scripts/log-cell.mjs:64-66: the symlink check is lstat then open, with only the final path component checked. TOCTOU window is negligible on a local single-user board; the usage.jsonl open is separately O_NOFOLLOW.
- Low, scripts/log-cell.mjs:39-52: no cap on the number of --failures items (each item is capped at 300 characters). Bounded only by the OS argv limit. Cosmetic.
- Low (pre-existing, out of scope), apps/organism-infra/board-service.mjs:1011-1013: release at resolved appends the resolved row with no duplicate check, unlike log-resolved.
- Note: the tool list is not exported from log-cell.mjs (qa noted it). Not a security matter.

## Next step
orchestrator proposes the merge (brain gate: user approves).
