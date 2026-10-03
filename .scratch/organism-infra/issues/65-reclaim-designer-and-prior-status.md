# 65: board reclaim for designer modes, keeping the prior status

**Type:** fix

**Priority:** P3

**What to build:** Follow-up from 55. `board reclaim` only accepts qa `specify`/`verify` modes, so it can't take over a designer-mode lock (`review|spec|critique|direction`). Reclaiming a qa `specify` lock also drops the prior status that 55 stores in the lock, so a later `--keep-status` leaves the ticket `claimed`. Accept designer modes in reclaim and carry the stored prior status across a reclaim.

**Blocked by:** 55

**Status:** parked

- [ ] `board reclaim <ref> designer --mode review` takes over a dead designer lock (test)
- [ ] Reclaiming a qa specify lock keeps the prior status; `--keep-status` then restores it (test)

## Comments
- **Follow-up (orchestrator, 2026-09-30):** raised by the 55 developer as out of scope.
- **orchestrator, 2026-09-30:** Scope note (security, 55): a designer review claim on an in-review ticket sets it to claimed (only qa/security keep in-review); decide whether designer review should keep in-review too.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
