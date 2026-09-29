# 35: Release events record --force, and the handoff gate is explained

**Type:** bug

**What to build:** During ticket 34, the developer's `board release --status in-review` was logged at 22:25:30Z (events seq 164), but its handoff file's mtime is 22:25:45Z. `release` calls `validateHandoffState` (board-service.mjs:858) unless `--force`, and the event has no `force` field, so we can't tell whether the gate was bypassed or the handoff was rewritten after an earlier valid write. Record `force: true|false` on every release event, and find out which happened here (reproduce: release with no handoff file must fail without --force).

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Every release event records whether `--force` was used (test)
- [x] A release to in-review with no matching handoff fails without --force (test)
- [x] The gate only accepts a handoff from the releasing cell: its State block names the same cell (and mode, for moded cells), and it was written after the current claim (test: an older handoff from another cell for the same ticket does not satisfy it)
- [x] The 34 case is explained in a comment here

## Comments

- **Created (orchestrator, 2026-09-28):** From qa verify on 34.
- **Second case (orchestrator, 2026-09-28):** fix1 on 34 also released before its handoff file existed, despite being told to write it first. Suspect the gate is not enforcing; raise priority.
- **Likely cause (orchestrator, 2026-09-28):** qa reports the gate accepts any `<NN>-*.md` handoff whose State block names the ticket. For 34, `34-qa-specify.md` already existed when the developer released, so the gate passed on qa's handoff, not the developer's. Fix: the gate should require a handoff written by the releasing cell (match cell/mode in the State block, or newer than the claim).
- **developer, 2026-09-28:** 34 case explained: 34-qa-specify.md (State ticket=34) existed when the developer released, so the gate passed on qa's handoff; the developer's own file was written after. Fixed by binding the gate to cell/mode and claim age; release events now record force.
- **qa, 2026-09-28:** QA pass (light verify): 266/266 tests, specify tests unchanged, fixtures not hollowed. See handoffs/35-qa-verify.md
- **Status (orchestrator, 2026-09-28):** qa verify passed on cd4cb91. risk-check hit board code; full security is next (next session, usage 75%).
- **security, 2026-09-29:** Security pass at cd4cb91: no findings at medium or above; 3 LOW notes. See handoffs/35-security.md
- **Resolved (orchestrator, 2026-09-28):** security passed (3 low notes); merged as PR #31 (96580d6).
