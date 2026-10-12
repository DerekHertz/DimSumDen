# Orchestrator handoff 121 (2026-10-12)

End-of-session handoff at the 70k context mark. No cell is running.

## Goal (user, 2026-10-12)
Send work to several headless agents from the interface by end of day. The user ruled product work goes before pipeline work.

## State
- **organism-infra/154-ui-dispatch-every-agent: `in-review`, architect done.** Branch `architect/154-ui-dispatch-every-agent` at 1e4c73d (docs only, pushed, no PR). Handoff `organism-infra/handoffs/154-architect.md`.
  - Drafts for tickets 226 (capacity rule and host admission), 227 (snapshot capacity and gate) and 228 (Den Run control; UI, designer spec with the user first) are in that handoff from line 46. **Not filed: the user is reading them first.** 226 blocks 227 blocks 228.
  - User rulings to fold in before filing: raise the live-agent cap to 8 (the amendment says max 2, cap 8; `MAX_CONCURRENT_AGENTS` in `apps/bridge/cells/policy.mjs`, ADR 0002, and the ADR 0011/0016 amendment text all need it); a stale lock counts toward the cap; claimed locks must be very visible in the UI so the user or orchestrator can clear them.
  - The architect notes den-v1/15 conflicts with 228 (a den task ticket left `ready-for-agent` would get a Run control).
  - Still to do: file the tickets on the user's yes, open the docs PR, resolve 154 at merge, then log `advisory-outcome` (orchestrator architect, Jev architect, user architect).
- **organism-infra/107-steering-slice-2: held by the user after qa specify.** 25 red tests on `tests/organism-infra-107-steering-slice-2` at 5c34b38. See the ticket comment for qa's two flags (no cancel on the real runtime).
- **queue/08-day-one-gate-run: paused at step 3 by the user (not urgent).** Class backfill is written (33fdd08). The gate is not applied and no active feature is set; the dry run still parks 21 tickets.
- Worktrees left: `agent-ad76281f4272745e6` (holds the 107 tests branch) and `agent-a8cb8f371c408f513` (holds the 154 architect branch). Both clean. Detach or remove before a cell needs those branches.

## Open with the user
- Verdict on the 226 to 228 drafts.
- The user wants the orchestrator to find work and pass it to headless sessions through the bridge, not run every cell from one session. No spec exists; grill it (genome step 2b) and name ADR 0016 and ADR 0019 to an architect.
- 228 is a UI ticket: the user runs `claude --agent designer` for its spec. That can run while 226 builds.

## Retro (window from 18:53Z; 6 items)
- No new fixes. The qa specify `--branch` refusal is already organism-infra/224. An architect cannot file tickets from its worktree (count 1).
- organism-infra/179 (`board help`) recurred in the architect run; unpark is on offer, not asked yet. The Grep tool was missing in a cell again though 156 is closed.
- Audit: 154 and agent-os/03 are `in-review` with no lock; both expected.

## Next
1. Fresh session: get the user's verdict on 226 to 228, file them with the cap at 8, open the 154 docs PR.
2. Propose 226 (code relay, qa specify first) and hand the user the designer prompt for 228.
3. Then 227, 228, den-v1/15.
