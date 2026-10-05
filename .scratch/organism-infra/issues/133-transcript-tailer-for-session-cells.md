# 133: The UI shows cells the orchestrator runs inside a desktop session

**Type:** feature

**Priority:** P2

**What to build:** After ADR 0016's slice 1, the UI shows only cells it started itself, because it reads each one's own output stream. Relays the orchestrator runs inside the user's desktop-app session are subagents with no stream the bridge owns, so they stay invisible. The user decided on 2026-09-28 that the event source is transcript tailing, and on 2026-10-01 accepted the child's stdout as the primary source for UI-started cells, with tailing kept for these other cells.

Build the transcript tailer: it follows the session transcript and the subagent transcripts beside it (an incremental read, not polling the whole file), feeds the same line parser as ticket 86, and surfaces those cells in the snapshot's `cells` with the same state and tool fields, marked as having no stop, approve or message capability (the bridge does not own them). Cell output stays untrusted: the path is built only from a validated session id and checked to stay under the user's transcript directory, and malformed, oversize and path-traversal input are dropped.

Spike S2 in ticket 84 shows whether subagent activity appears on a child's stdout, which tells whether the same tailer is also needed for subagents of UI-started cells.

**Blocked by:** 105, 106

**Status:** parked

- [ ] A recorded desktop-session relay fixture produces the expected cell states and tool events in the snapshot (test)
- [ ] The tailer's path builder accepts only a UUID session id and refuses a path that escapes the transcript directory, including through a symlink (tests)
- [ ] Malformed, oversize and no-newline lines are dropped without throwing (tests)
- [ ] Cells it surfaces report no stop, approve or message capability
- [ ] Reading transcripts causes no write to them and no polling loop over whole files

## Comments
- **Created (orchestrator, 2026-10-01):** at the user's request ("yes on transcript tailer"), from ADR 0016 decision 2, where the tailer was kept only as a secondary feeder. Scope to settle in qa specify: whether to include the subagent case after S2.
- **orchestrator, 2026-10-04:** Filed from the Mac session of 2026-10-01, where it was ticket 94 and never pushed. Renumbered because main reused 82-94. Other Mac numbers in the body map to main as: 83, 84 -> 105; 86, 87, 88, 89 -> 106; 90 -> 107.
- **orchestrator, 2026-10-05:** Parked: Parked at filing (user, 2026-10-04): refocus rules supersede; names no v1 den-loop step or repeated testbed friction (docs/refocus/triage-2026-10-02.md)
