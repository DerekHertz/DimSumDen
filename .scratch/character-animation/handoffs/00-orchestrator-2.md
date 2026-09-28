# Handoff: character-animation board, orchestrator pass (2026-09-26)

**State**: blocked on Blender -- no ticket dispatchable from a subagent session right now.

## What changed

Nothing committed. No cells were claimed or dispatched this session. Board reviewed only:
`.scratch/character-animation/issues/05` through `10`, all currently `ready-for-agent` except 08 (`Blocked by: 07`).

## Findings

Tickets 05, 06, 07, 09, 10 are unblocked (04 and, for 10, also 02 are resolved). 08 is blocked by 07.
Every one of 05-10 requires *new* clips or textures baked into the panda glb as part of its own
acceptance criteria (hop/waddle/land-squish, point/look-up, Brain habit clips, muscle/security/qa
habit clips, Bao-only clips + inbox look-at target, baked fuzz textures + rim-light shader).

Per ticket 03's precedent (`handoffs/03-developer.md`) and ticket 01's history, glb/clip/texture
authoring needs Blender running with the MCP add-on, which only a **main-session** `developer`
(`claude --agent developer`, not a subagent dispatch) has access to. Ticket 04 is the one exception
so far: its director logic only *consumed* clips ticket 03 had already baked in, so it didn't need
Blender -- that pattern doesn't apply to any of 05-10, since each names its own new clips/textures
in its own acceptance criteria.

## Decisions made

- Did not split any ticket into a "director code only" vs "asset authoring" pair. That would change
  the board's ticket boundaries and needs the user's sign-off (via `/to-tickets` or similar), not a
  unilateral orchestrator call.

## Next step

Run a **main-session** `developer` cell (`claude --agent developer`, Blender open with the panda
scene loaded) against one of the unblocked tickets: 05, 06, 07, 09, or 10, in that priority order
(07 unblocks 08). Claim the ticket per `docs/agents/issue-tracker.md` before starting.

## Suggested skills

`organism-protocol` (preloaded), `implement`, `asset-critique` (for the visual-critique round before
any `ready-for-human` gate -- 10 ends in one explicitly).

## Gotchas

- No lock files exist on the board right now -- nothing is stuck mid-claim.
- Uncommitted board edits (`issues/01`, `03`, `04.md`) and untracked handoffs
  (`handoffs/00-orchestrator.md`, `01-developer.md`, `01-orchestrator.md`) are pre-existing from prior
  sessions; leave them in place, they are not part of this pass.
- Ticket 10 ends in a `ready-for-human` frame-rate/visual verdict -- don't resolve it without the user.

**Correction (main session, 2026-09-26):** The claim that subagent-dispatched developers lack Blender MCP tools is stale. A developer subagent from the main session had all six tools and read the open scene. Ticket 01's failure is unexplained; untested suspect is nesting (orchestrator subagent -> developer).
