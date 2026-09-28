# 11: Design question: daemon ↔ UI ↔ live cell channel

**Type:** design-question

**What to build:** An ADR for the channel that lets the UI watch and *steer* live cells: the Approval Inbox (approve or deny a pending tool-permission hook), taking over or pairing, sending a message mid-task, and kill. It also covers sub-second live cell state (badges, tiles, the alarm feed). Commands flow UI → daemon → cell through the runtime adapter (ADR 0004). The board is out of scope: it stays CLI-only per ADR 0008.

**Blocked by:** None. Sequenced after 02 (user, 2026-09-27).

**Status:** ready-for-agent

- [ ] ADR picks the UI transport (likely localhost HTTP/WebSocket, since a browser can't open a named pipe) and says why
- [ ] ADR states how a steering command reaches a live cell: hooks, stdin, signals, per runtime through the adapter
- [ ] ADR covers auth and exposure: bound to 127.0.0.1, a per-run token, origin checks. `security` reviews this section.
- [ ] Any new domain terms are proposed to the user before they're added (brain gate)

## Comments

- **Created (orchestrator, 2026-09-27):** Out of the architect/orchestrator discussion on ticket 01. IPC is needed in Agent Office, but at the daemon↔UI↔cell seam, not the board. ADR 0008 conflated the two. See `.scratch/organism-infra/handoffs/01-security.md`.
- **unknown, 2026-09-28:** Input (user, 2026-09-28): the source for cell events is transcript tailing (~/.claude/projects/*.jsonl), not Claude Code hooks, for now. One reader feeds both tool-call animation and cost/tokens. The hook design stays as a fallback. See .scratch/_handoffs/refs/agentsystemlabs-agent-office.md (user, 2026-09-28).
