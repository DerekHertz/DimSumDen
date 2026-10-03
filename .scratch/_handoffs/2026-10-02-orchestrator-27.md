# Orchestrator handoff 27 (2026-10-02)

State, not rules; the genome wins.

## Ticket 11 (den-scene-v1/11-bigger-cuter-bao): RESOLVED
- PR #147 merged to main (CI green: test + security; risk-check clean). Board resolved via `board resolve --pr 147`. Advisory-outcome row logged (designer/designer/designer, bounced false).
- Option B (Soft bun) shipped: Bao scale 2.1, pose table, content_squint face, softened patches, bone-anchored Pass seats (`bao-pose.mjs`, `bao-seats.mjs`), layout ripple, `PAD_CHIP_Y` -0.05.
- Cost: about 700k tokens across about 12 cells. Many cells passed the 80k context cap (qa specify x3, developer x2, designer review x2, qa verify). User's verdict: too expensive; plan before renders.

## Lesson for next session (user's ask)
Plan and size a UI ticket BEFORE any designer renders or qa specify:
- Settle scope and numbers in one short spec, and split into tickets sized for one cell each (the 80k cap) at spec time, not mid-relay.
- Start-here context file was about 20k tokens and spec plus amendment plus two handoffs ate cells' budgets before work began. Give cells narrow read lists.
- The designer's spec had 3 internal conflicts that cost an amendment round. Have architect or qa check a spec for conflicts before specify.
- Consider an architect ticket for the contexts-per-cell problem (see organism-infra/119 and 122, new-session-per-ticket).

## Follow-ups, none filed as tickets yet (ask the user which to file)
1. Chip viewport clamp: front-kiosk 'Blocked' chip clips at 375px (`ChipLayer.jsx`, no edge clamp). Was -20.6 px before ticket 11, now about -29 px.
2. Slot 2 Pass panda hidden behind Bao from the default camera (open question: does a third of one type matter?).
3. Designer nits: softened patch edges ragged at 2x (feather in `softenPatches`); two grove tufts inside Bao's footprint; handoff arc passes within 0.25 of near stalk #10 (unverified by eye); pill text about 7 px at 375.
4. Deferred by user: eye-patch overlay and a fully three.js Bao and pandas. Suggest an architect ticket.
5. Design-system edits and zoom-frames refresh after ship, with user approval.
6. Process friction seen: `board release --keep-status` leaves status `claimed`; scout given a directory instead of a glob; shared /tmp files from other cells block Write; `log-cell` wants a `-` handoff name match (partial handoffs needed `--allow-no-handoff`); `board claim` needs `<ref> <cellType>` positionally (no `--cell`); `board resolve` is the way to resolve.

## Housekeeping
- worktree-gc --apply removed 5 worktrees and branches. Still locked by live pids: agent-a04a7c01ef0ae2338, a25835ef4d5534b47, aff7a9c3f9bcca5c1 (pid 819752), a3a7353aaf6862398, a86475f05242e01e0 (pid 659329). Branches `feat/11-bigger-cuter-bao-3`, `-5`, `-8` remain. Rerun `node scripts/worktree-gc.mjs --apply` once those free up.
- Pipeline-retro: due after every third resolved ticket; I did not count. Check before the next dispatch.
- Uncommitted on main: `.scratch` handoffs, refs, `_context`, usage and events rows (never committed by design unless the user says).

## Usage
74-75% 5h (resets 2026-10-03 01:00 UTC), 74% weekly (resets 2026-10-05). Last live read after qa verify.
