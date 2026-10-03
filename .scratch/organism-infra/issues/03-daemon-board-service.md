# 03: Daemon board service with IPC and event log

**Priority:** P2

**What to build:** A minimal daemon process that owns the board, per 01's ADR. It serves the `board` CLI over the chosen local IPC transport, serializes every operation, and appends each change to the event log. It also streams events to subscribers. When the daemon is up, the CLI routes through it; when it's down, the CLI falls back to the direct-file backend from ticket 02.

**Blocked by:** 01, 02

**Status:** closed

- [ ] The CLI routes through the daemon when it's running and falls back cleanly when it isn't (both paths tested)
- [ ] Ten concurrent claims or comments leave the board consistent, with no lost writes (tested)
- [ ] `board subscribe` streams events in order; the event log can be replayed to rebuild the board's state
- [ ] The transport is local-only, per the ADR's auth section; `security` passes it
- [ ] Runs the full code relay: qa specify, developer, qa verify, security review
- **Parked (user, 2026-09-27):** ADR 0008 is simplified to CLI-only: the `board` CLI is the single writer, with no daemon or IPC. Why: one cell at a time, and the daemon's IPC brought the security findings on organism-infra/01. Revisit when we need more than one writing process (for example, parallel cells).
- **orchestrator, 2026-10-02:** Retro: board audit found every blocker (01, 02) resolved; status blocked → ready-for-agent (user yes).

## Comments
- **orchestrator, 2026-10-03:** Closed: superseded: ADR 0016 grows the bridge in place (refocus, docs/refocus/triage-2026-10-02.md)
