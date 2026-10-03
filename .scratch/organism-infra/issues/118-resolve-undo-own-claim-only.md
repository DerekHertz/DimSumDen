# 118: board resolve: undo only this run's own claim, checked under the write lock

**Type:** fix

**Priority:** P2

**Blocked by:** 114

**Status:** parked

## What to build

Security review of 114 (handoff `114-security.md`, pass with nits):

1. **Medium:** the holder is read outside the write lock, and `release(..., {force:true})` doesn't re-check it, so a `board reclaim` landing between read and release lets resolve reset another cell's claim. Add an `expectCell` (or expected-lock) option to `release` and check it under the write lock.
2. **Medium:** the undo keys on cell type, not on this run's claim. Two overlapping `board resolve` runs on one ref: the second's failed `claim()` sees "orchestrator" and force-releases the first run's live claim. Set `claimed = true` only after this run's `claim()` returns, and undo only then.
3. **Low:** validate the echoed holder against known cells before printing it.

Files: `apps/organism-infra/board-service.mjs`, `apps/organism-infra/board-resolve.test.mjs`.

## Acceptance criteria

- [ ] A failed `claim()` in resolve never releases a lock it didn't create (test: overlapping orchestrator claim survives)
- [ ] A forced undo refuses when the lock's holder changed after it was read (checked under the write lock)
- [ ] A holder name that isn't a known cell is not echoed raw
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed from 114's security review; not blocking 114's merge.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
