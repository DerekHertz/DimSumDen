# 01: Design question: board service, IPC and event queue

**Type:** design-question

**What to build:** An ADR amending ADR 0003. It records how cells stop writing board files directly and instead go through a single writer:
- The board service lives in the daemon.
- Cells reach it through a `board` CLI over local IPC: named pipes on Windows, Unix sockets elsewhere, or localhost HTTP with a token. Pick one and give the reasons.
- Operations are serialized in-process, and every change is appended to an event log (`events.jsonl`) that cells and the UI can subscribe to.

Markdown stays the storage format. External brokers (Redis, RabbitMQ) are out of scope unless the ADR shows they're needed. Settle the choice against ADR 0004 (OS- and runtime-agnostic) and ADR 0002 (relay, Pro-plan limits).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] ADR states the transport, the CLI command set (claim, release, status, comment, list, subscribe), and the event schema
- [ ] ADR states the fallback when the daemon isn't running: direct atomic file writes with the same CLI
- [ ] ADR covers auth and exposure: local-only, and who may call it. `security` reviews this section.
- [ ] Any new domain terms are added to `CONTEXT.md` (brain gate: ask first)

## Comments

- **Created (main session, 2026-09-26):** At the user's request ("IPC or message queues" for the board). Why: cells in worktrees can't write the main checkout's board with their file tools, because the desktop app's worktree guard blocks it, so today they improvise shell writes. Lock-file claims can also race.
