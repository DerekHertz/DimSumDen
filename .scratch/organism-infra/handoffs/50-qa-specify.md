```json
{"ticket": "organism-infra/50", "cell": "qa", "mode": "specify", "current_step": "Failing tests committed on feature/organism-infra-50-verdict-lock (5e46213); 9 red.",
 "artifacts": ["scripts/verdict-lock-failures.test.mjs", "scripts/verdict-roles.test.mjs", "scripts/usage-rows.test.mjs"],
 "decisions": ["A qa lock permits --verdict only in mode verify (accepted by coordinator)."],
 "failures": ["Bash guard refused a heredoc edit script; used Write plus node instead."],
 "pending": [{"item": "Implement verdict lock, log-cell --failures, symlinked .scratch check, log-resolved write lock, ADR 0008 update", "owner": "developer"}]}
```

## State
Done. 58 pass, 9 fail (all for the missing feature).

## What changed
Branch `feature/organism-infra-50-verdict-lock`, commit `5e46213` (base 597f3c2). New test file plus the two updated files above (no-lock `--as` verdict tests moved to the lock contract; qa owns them).

## Pinned contract
- `board comment --verdict` with no claim lock is refused for every author, orchestrator included, with or without `--as`. Non-zero exit, stderr mentions "verdict" and "lock", nothing written. Author is the lock's cell; `--as` must match.
- A qa lock permits a verdict only in mode `verify`; qa `specify` is refused. security and orchestrator locks need no mode.
- A comment without `--verdict` keeps today's rules (no lock plus `--as` still accepted).
- `log-cell --failures "<tool>:<what>;..."`: split on `;`, then first `:`. One incident row per item after the cell row, in order, keys exactly kind, ts, ticket, cell, tool, what, cost, fix, rule_change, source ("cell-report"). ticket and cell come from the cell row's args. Tools: bash-guard, board-claim, board-release, board-comment, board-handoff, handoff-state, git, npm, write, ci, other. Unknown tool, empty or whitespace-only what, what over 300, or an item with no ":" is refused and nothing is written, not even the cell row. Exactly 300 is accepted.
- `log-cell` refuses a symlinked `<root>/.scratch` (non-zero, nothing written through it), like log-resolved.
- N concurrent `log-resolved` runs write exactly one row; exactly one exits 0.
- ADR 0008 must match `/verdict[^\n]*(claim )?lock|lock[^\n]*verdict/i` and contain `--failures`.

## Vacuous-pass notes
- The concurrent log-resolved test is green already, even at 32 runs; it is a regression guard, not red. Developer must still put the duplicate check and append under the board write lock.
- The 6 `--failures` refusal tests pass now only because `--failures` is an unrecognized flag. They gain meaning once the three `--failures` accept tests go green.
- The export of the tool list from log-cell.mjs is not tested (importing the script runs it).

## Next step
Developer makes the 9 red tests pass without weakening any test. Verify by qa afterwards.

## Suggested skills
tdd, implement.

## Gotchas
Worktree guard rejects heredocs; write scripts with Write and run with node.
