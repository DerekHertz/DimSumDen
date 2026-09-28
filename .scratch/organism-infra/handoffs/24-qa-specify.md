## State
```json
{"ticket": "organism-infra/24-board-claim-ergonomics", "current_step": "qa specify complete: failing tests committed",
 "artifacts": ["apps/organism-infra/board-claim-ergonomics.test.mjs", "apps/organism-infra/board-comment-hardening.test.mjs"],
 "decisions": [
   "pinned `board comment <ref> --as <cell> text`; no lock and no --as is rejected",
   "pinned `board reclaim <ref> <cell>`: takes over an existing lock (lock names new cell, status stays claimed, events op reclaim); rejected when no lock exists",
   "pinned `release <ref> --keep-status`: lock freed, ticket byte-identical; mutually exclusive with --status",
   "pinned scope-added rule: only an orchestrator claim may release at resolved; --force does not bypass it",
   "edited board-comment-hardening.test.mjs (ticket 12) `--as x` test: --as is now a valid flag, so the old 'must be rejected' assertion became 'accepted, x is the author'"
 ],
 "failures": [],
 "pending": [{"item": "implement --as on comment, reclaim subcommand, release --keep-status, only-orchestrator-resolves in board.mjs/board-service.mjs; keep all board tests green", "owner": "developer"}]}
```

**State**: done (specify). Branch `worktree-agent-a46249dd60c7cbc27`, commit `bc55a9d`, not pushed.

**Result**: 12 tests added in `board-claim-ergonomics.test.mjs`; `node --test` on it plus the comment-hardening file gives 8 failing, all for missing features. 4 new tests pass today: 2 are regression guards (comment with lock uses the lock's cell, orchestrator can resolve) and 2 pass because unknown subcommand/flag is already rejected (reclaim on unclaimed ticket, `--keep-status --status`). The developer must keep them green.

**Criterion map**
1. Comment author: tests 1-3 (reject with no source, `--as` records cell, lock cell still used).
2. Stale claim taken over in one command: `reclaim` takes over; `reclaim` with no lock rejected.
3. `release --keep-status`: frees lock, status unchanged; exclusive with `--status`.
4. Scope added (only orchestrator resolves): developer, security, qa-verify rejected (also with `--force`); orchestrator allowed.

`human-verified`: none. Note "stale" has no mechanical definition for claim locks (no pid), so `reclaim` is pinned to work on any existing lock; developer/orchestrator may tighten.

**incidents (ticket 27 WSL trial)**
- The isolation guard rejected a compound `cd <main> && git ...` and a `;`-chained git command; splitting into plain commands worked.
- `npm ci` ran cleanly, no prompts, no CRLF or path issues. `npm run board` worked from the worktree.
