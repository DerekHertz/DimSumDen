```json
{"ticket": "organism-infra/71-jev-priority-scope-shadow", "cell": "developer",
 "current_step": "Done: qa's 47 tests pass, 7 developer tests added, npm test 1073/1073, committed 987d10d on dev/71-jev-priority-scope-shadow (not pushed)",
 "artifacts": [
   "scripts/jev.mjs (priority and scope points, rankFrontier, orderRow, CLI points)",
   "scripts/jev-report.mjs (report.priority, report.scope, pass/fail lines)",
   "scripts/jev-order.test.mjs (7 tests: order row, fills bar, input allowlist, CLI)"
 ],
 "decisions": [
   "priority and scope join route in a closed-set group: any output outside the label set is other, and a shadow result hides pick and conf",
   "priority with no explicit **Priority:** P0-P3 line falls back no-line before any input is built",
   "tercile edge = Math.round(n/3), because qa's tests need 7/6/7 at n=20 and 6/7/6 at n=19 (plain floor gives 6/8/6)",
   "scope scores one row per ticket (latest answered row), like the tier and verify points; fallback rows are skipped",
   "fills bar reads kind:jev-priority-fill-verdict rows {accept:boolean}; it FAILs today because fills are out of v1"
 ],
 "failures": [],
 "pending": [
   {"item": "Wire orderRow into whatever computes the frontier, so a jev-order row is appended to usage.jsonl (orchestrator genome or board, outside this ticket)", "owner": "orchestrator"},
   {"item": "Nothing writes jev-priority-verdict rows yet; the flagging bar needs a user review step to record them", "owner": "orchestrator"}
 ]}
```

## State

Done. Branch `dev/71-jev-priority-scope-shadow`, commit `987d10d` on top of qa's `8bfcb8f`. Not pushed.

## What changed

- `jev.mjs`: new `priority` point (labels `mismatch | ok | other`) and `scope` point (labels `small | medium | large | other`). Both send only the ticket text through the same `hasSecret` check from `scripts/exposure.mjs` as every other point. Neither has a reserved budget, so both draw from the $0.35 shared remainder. In shadow mode `actual` is `orchestrator` and the result shows no pick. `rankFrontier(tickets)` sorts by P-level, then unblock count (highest first), then scope, then ticket number. `orderRow({tickets, actual, now})` returns a `kind:"jev-order"` row with `actual`, `wouldHave` and `same`. When no actual order is given, it uses today's code order (P-level, then number). The CLI now accepts `priority` and `scope`.
- `jev-report.mjs`: `report.priority` has `rows`, `flagged`, `flagRate` and `checks.flagging`/`checks.fills`. `report.scope` has `rows`, `sameTercile`, `sameTercileRate`, `smallWasLargeInLast10`, `misses` and `checks.scope`. `formatReport` prints the lines `priority flagging:`, `priority fills:` and `scope:` as PASS/FAIL, plus one line per scope miss.

## Tests

- qa specify: `jev-priority` 13/13, `jev-scope` 15/15, `jev-priority-scope-report` 19/19. The three files are unchanged since `8bfcb8f`.
- Developer: `jev-order.test.mjs` 7/7.
- `npm test`: 1073 pass, 0 fail, 0 skipped.

## Gotchas

- The qa handoff describes the tercile boundary as "floor", but its tests need rounding (see decisions). The tests win; no test contradicts the ticket.
- The ADR's "no line means P2" applies to the caller that builds `rankFrontier` input. `rankFrontier` expects a numeric `priority`.
