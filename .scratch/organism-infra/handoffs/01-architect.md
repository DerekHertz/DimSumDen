**State**: done (revised).

**What changed**: `docs/adr/0008-board-service.md` and `CONTEXT.md` (Board service wording), branch `claude/organism-infra-01-board-service-adr`, commit `048868b` (on top of `0791eaf`, off `origin/main` 3d6df35), in worktree `agent-a6bf6b8f012434c04`. Not pushed. Ticket `.scratch/organism-infra/issues/01-board-service-design.md` Status and lock untouched (owned by orchestrator).

**Decisions made** (full reasoning in the ADR):
- Descoped to CLI-only per the user-approved joint architect/orchestrator recommendation, after security bounced the original named-pipe/Unix-socket design (Windows default-DACL read exposure, pipe squatting, socket-dir perms, subscribe backpressure).
- The `board` CLI is now the sole writer, calling the board-service module in-process (no daemon in the loop). `O_EXCL` locking with stale-lock handling now covers every mutating op (claim/release/status/comment), not just claim — closes security's fallback-atomicity finding.
- Daemon IPC (ticket 03) is deferred, not designed out: parked until `max_concurrent_cells > 1` makes a second writer real. The board-service module boundary is unchanged so a daemon wrapper stays additive later; it will need its own ADR for the pipe/socket security decisions this one defers.
- Daemon↔UI↔cell steering (approve/deny, pair, kill, live state) is explicitly out of scope here — separate seam, ticket `organism-infra/11`.
- Security's remaining findings (path-traversal validation, full-mutation locking scope, bounded arg/line sizes) folded into ticket 02's requirements (ADR decision 6).

**Next step**: ticket 02 (board CLI) is unblocked and can be dispatched to a developer against the module boundary in ADR decision 1, with the requirements in decision 6. Ticket 03 stays on hold. Ticket `organism-infra/11` (daemon↔UI↔cell channel) is separately sequenced, per the user's decision, right after ticket 02.

**Suggested skills**: `codebase-design` for ticket 02 (module/seam vocabulary carries over); `domain-modeling` if further CONTEXT.md terms come up for ticket 11.

**Gotchas**: none this round — CONTEXT.md's Board service/Board event terms were already added by another cell (commit `a2f395f`) before this revision; I only reworded the Board service entry per the coordinator's instruction, didn't touch Board event.
