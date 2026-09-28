## State
```json
{"ticket": "organism-infra/24-board-claim-ergonomics", "current_step": "security bounce fixed, full npm test green",
 "artifacts": ["apps/organism-infra/board-service.mjs", "apps/organism-infra/board.mjs", "apps/organism-infra/board-identity-hardening.test.mjs"],
 "decisions": [
   "claim, reclaim and comment --as validate against the known cell set (product, architect, orchestrator, developer, scout, debugger, qa, security, designer); newline, CR, U+2028 and unknown names rejected",
   "reclaim refuses orchestrator outright and requires --reason, recorded as `reason` in the reclaim event",
   "comment with a lock: --as must equal the lock's cell, else rejected; --as alone applies only with no lock",
   "qa nit: board-cli.test.mjs comment test no longer passes --as qa"
 ],
 "failures": [],
 "pending": [{"item": "re-verify, then re-run security review of 9c285a7", "owner": "qa"}]}
```

**State**: in-review. Branch `worktree-agent-adc89273429387ecd`, commit 9c285a7 (fast-forwarded from e964665; worktree branch is `worktree-agent-a5ccf60e5b3ed95f6`, same history). `npm test`: 236 pass, 0 fail. New tests: `board-identity-hardening.test.mjs` (15 tests).

**Existing-test edits to flag**: reclaim test in board-claim-ergonomics now passes `--reason`; board-comment-hardening `--as x` became `--as qa` (x is not a cell); board-status-and-lock concurrent test uses `--as developer` to match its developer lock.

**Proposed gated text (not applied)**

ADR 0008, command set:
- `board reclaim <ref> <cell> --reason "<text>" [--mode m]`: take over an existing lock. `<cell>` must be a known cell and never `orchestrator`. `--reason` is required and stored in the event.
- `board comment <ref> [--as <cell>] "<text>"`: `--as` must name a known cell. With a claim lock, `--as` must equal the lock's cell; without one, `--as` is the author. With neither, rejected.
- `board release <ref> --keep-status`: frees the lock, leaves the status alone. Only a claim held by orchestrator may release at `resolved`.
- Limit to note: cell identity is self-declared and not authenticated; validation only guarantees it names a real cell and cannot carry markup. `claim orchestrator` on an unlocked ticket remains open by design.

organism-protocol, board section: add "Take over a dead holder's lock with `board reclaim <ref> <cell> --reason "..."` (never as orchestrator). Use `board comment --as <cell>` only when you hold no lock; with a lock it must match your cell."

**incidents (ticket 27 WSL trial)**
- Bash rejected a heredoc-plus-python compound command as too complex for the worktree guard; used Write for the test file and node scripts instead. Genuine guardrail.
- Worktree started on 5c7ce80, not e964665; `git merge --ff-only e964665` fixed it.
