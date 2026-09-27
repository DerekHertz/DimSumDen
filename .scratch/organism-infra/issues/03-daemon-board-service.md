# 03: Daemon board service with IPC and event log

**What to build:** A minimal daemon process that owns the board, per 01's ADR. It serves the `board` CLI over the chosen local IPC transport, serializes every operation, and appends each change to the event log. It also streams events to subscribers. When the daemon is up, the CLI routes through it; when it's down, the CLI falls back to the direct-file backend from ticket 02.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] The CLI routes through the daemon when it's running and falls back cleanly when it isn't (both paths tested)
- [ ] Ten concurrent claims or comments leave the board consistent, with no lost writes (tested)
- [ ] `board subscribe` streams events in order; the event log can be replayed to rebuild the board's state
- [ ] The transport is local-only, per the ADR's auth section; `security` passes it
- [ ] Runs the full code relay: qa specify, developer, qa verify, security review
