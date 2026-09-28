# Handoff: organism-infra/01 — security round-2 review of ADR 0008 (CLI-only revision)

**Cell:** security
**Ticket:** organism-infra/01 (`.scratch/organism-infra/issues/01-board-service-design.md`)
**Reviewed:** `docs/adr/0008-board-service.md` at commit `048868b`, diffed against `0791eaf` (round-1 reviewed commit)
**Verdict:** Security bounce (round 2 of the allowed 2)

## Findings checked against round-1 (`.scratch/organism-infra/handoffs/01-security.md`)

**Correctly dropped (no longer apply):**
- Windows named-pipe default DACL, pipe-name squatting, POSIX socket-dir permissions, `subscribe` backpressure/DoS — all transport-specific. Decision 5 states there is no pipe/socket surface at all in the CLI-only design, which is accurate: `subscribe` now tails `events.jsonl` per-invocation, so there's no shared daemon-side buffer to exhaust and no listener name to squat.

**Correctly kept and precise enough for ticket 02:**
- Path-traversal/id validation: decision 6 gives literal regexes (`^[a-z0-9-]+$`, `^\d{2}-[a-z0-9-]+$`) plus "resolve and verify the joined path stays under the board root ... rejecting `..`, absolute paths, and symlink escapes." Implementable and testable as written.
- Full-mutation locking: decision 2 explicitly states the lock guards claim/release/status/comment, "the full read-modify-write of each, not only the claim step," closing the round-1 fallback-atomicity gap.
- Bounded sizes: decision 6's "cap accepted comment/arg length before parsing" correctly translates the round-1 NDJSON line-length cap into the CLI-arg context (no NDJSON protocol exists anymore).

**Kept but not precise enough — High, requires ADR text fix:**
Decision 2's stale-lock criterion: *"A lock older than a fixed staleness threshold (e.g. its holder's process is no longer running) is reclaimable."* This conflates two different mechanisms (elapsed-time expiry vs. liveness check) via a loose "e.g." without saying which one actually governs reclaim. Two concrete problems:
1. The lock-file format used elsewhere in this repo (per `docs/agents/issue-tracker.md` / organism-protocol: `echo "<cell-type> $(date -u +%FT%TZ)" > lock`) has no PID field, so "process is no longer running" is not actually checkable as worded — ticket 02 has nothing to check liveness against unless the ADR also mandates adding a PID to the lock file contents.
2. If ticket 02 instead implements pure elapsed-time expiry (the only mechanism the current lock format supports), a legitimately slow mutation (e.g. a large markdown edit or a loaded disk) that runs past the threshold becomes reclaimable by a second process while the first is still live — exactly the "steal a live lock" failure mode this decision exists to prevent.

**Required ADR change (either one closes it):**
- (a) Require the lock file to record the holder's PID; require reclaim to verify that PID is actually dead via an OS-appropriate check (e.g. `tasklist /FI "PID eq <n>"` on Windows, signal-0-equivalent on POSIX, with PID-reuse considered) before deleting the lock; and make the delete-then-recreate step itself race-free (e.g. re-run the `O_EXCL` create immediately after removing the stale lock, and treat a create failure there as "someone else beat us to it," not as fatal).
- (b) Or, if staying purely time-based, state the threshold's safety rationale explicitly: the threshold must exceed the maximum duration of any legitimate mutating op, and long-running ops must renew/touch the lock's mtime periodically so they're never mistaken for stale.

## Dependencies / secrets
No new dependency, install script, or secret in this diff (ADR text + CONTEXT.md wording only, per `git diff 0791eaf 048868b`). Nothing to check against `npm audit`/lockfile yet.

## Recommendation
Bounce to architect for a one-decision text fix on decision 2 (stale-lock reclaim mechanism). Everything else in the revised ADR is sound and ready for ticket 02. This is the round-2 (of 2 allowed) bounce; if the fix is a tight, mechanical addition to decision 2 only, a third pass shouldn't be needed.
