# 63: Refresh-usage button in the UI

**Type:** feature

**Priority:** P3

**What to build:** A button on Today's board that refreshes plan usage. It calls a bridge endpoint that runs `node scripts/usage.mjs` (the same OAuth usage source `/usage` reads), appends the usage row, and updates the plan-usage bar. `/usage` itself can't be triggered from outside Claude Code. In a cloud session (no credentials) the button says to paste `/usage` instead.

**Blocked by:** None

**Status:** parked

- [ ] Button triggers a bridge route that runs usage.mjs and appends a `usage` row (test)
- [ ] Plan-usage bar updates from the new row
- [ ] With no credentials, the button shows the paste-/usage hint instead of an error (test)

## Comments
- **Idea (user, 2026-09-30):** logged as a low-priority idea.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
