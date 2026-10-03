# 04: Meeting storage and 24-hour retention tool

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** parked

**Design refs:** `.scratch/crew-dashboard/spec.md`

## What to build

A board-side script creates and manages a meeting directory beside its ticket, per ADR 0017 decisions 8 and 11: `meeting.md` (topic, participants up to six, depth, status `open`, `briefed`, `decided`, `closed`), one file per take, `brief.md`, an append-only `thread.jsonl`. A compact command, run for meetings closed more than 24 hours ago, writes `summary.md` and deletes the takes and `thread.jsonl`, keeping `brief.md`, `meeting.md` and the summary. It spawns no cell and has no UI: plain files, fully testable. The summary is supplied by the caller (the chair, later); the tool only requires it to exist.

## Acceptance criteria

- [ ] Create, add-take, set-status and append-thread operations produce the files and refuse a seventh participant
- [ ] Compact before 24 hours is refused; after 24 hours with a summary present it keeps `meeting.md`, `brief.md` and `summary.md` and removes takes and the thread
- [ ] Compact with no summary is refused and changes nothing
- [ ] Reopening a decided meeting writes a new brief version and keeps the old one
- [ ] A meeting needs a ticket: creating one for a missing ticket fails
- [ ] Board events record each change

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-03:** Parked: not a v1 den-loop step; revisit when growing the den (refocus, docs/refocus/triage-2026-10-02.md)
