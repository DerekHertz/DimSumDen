```json
{"ticket": "organism-infra/72", "cell": "developer", "current_step": "Wake prelude and wake go-live bar implemented on feat/72-wake-gate-prelude (97b02c7); all qa tests pass; ready for qa verify.",
 "artifacts": ["scripts/jev-wake-prelude.mjs", "scripts/jev-wake-prelude-cli.test.mjs", "scripts/jev-report.mjs", "scripts/jev.mjs"],
 "decisions": ["CLI needs --since <iso|last>; no args exits 2 so npm test never reads the real board or calls Jev", "Wake coverage bar counts 15 informational labels (ADR 0015 decision 6), not 15 rows", "Usage at 80%+ wakes, as qa pinned"],
 "failures": ["rg on apps/organism-infra/lib: path does not exist (exit 2)", "node -e validation one-liner: shell ate the backtick regex; reran as a script", "grep for test totals on dot-reporter output: no totals printed (exit 1)"],
 "pending": [{"item": "qa verify of feat/72-wake-gate-prelude", "owner": "qa"}, {"item": "security review: risk-check hits (gh shell-out, board code, fake sk- key in qa test)", "owner": "security"}, {"item": "apply the orchestrator genome edit below, with the user's permission", "owner": "orchestrator"}]}
```

**cell:** developer | **branch:** feat/72-wake-gate-prelude | **commits:** 5f6c91b (qa tests), 97b02c7 (implementation)

## State
Done. 40/40 qa tests pass, plus 8 new ones; `npm test` 1153/1153, 0 skipped.

## What changed
- `scripts/jev-wake-prelude.mjs` (new): `codeDecides`, `runPrelude`, and the glue `newInputs`, `lastOrchestratorTs`, `ciFromPrs`. The CLI (`--since <iso|last>`) reads the frontier, 5-hour usage and pending gate requests via the bridge's `buildSnapshot`. It reads CI and conflicts from `gh pr list` (15 s timeout), but only when nothing local already wakes. It prints one JSON line and appends one `jev` row per Jev call to `usage.jsonl`.
- `scripts/jev-report.mjs`: adds `report.wake` and the lines `wake coverage|safety|spend: PASS|FAIL`.
- `scripts/jev.mjs`: `codeWakes` is now exported (one word).
- `scripts/jev-wake-prelude-cli.test.mjs`: tests for the glue, plus a CLI run on a temp board.

## Decisions made
- `--since last` means the orchestrator's newest `events.jsonl` row. If there is none, the prelude wakes. Comments the orchestrator wrote itself are never new inputs.
- A code-wake comment stops the run before any Jev call, the same way `codeDecides` does. Otherwise every ambiguous input gets a label, to collect more shadow rows.
- An open user-verdict gate request means a pending row in `_requests/requests.jsonl`. Those rows are never sent to Jev (security 67).
- If `gh` can't be read, the prelude wakes (`ciUnknown`, reason "CI state unreadable").
- Wake coverage requires 15 informational labels, a fallback rate of at most 1 in 5, and a median under 2000 ms. qa's test header says "rows >= 15". The tests pass either way; I followed the ADR because it is stricter.
- A missed wake counts a claim, comment or release by any cell, following qa's contract.
- Review: the genome only allows `scout` subagents, so I ran both axes inline. Standards found one duplication, now fixed (`readJsonl` reuses `metrics.mjs` `parseJsonl`). Two judgement calls: `codeWakeKind` repeats `codeWakes`' branches to build reason text, and `wakeReport`'s latest-row-per-ticket loop repeats the route and scope pattern already in that file. Spec: all six criteria are covered.

## For the orchestrator
- The ADR lists "usage under 80%" among the code conditions. qa pinned the opposite: usage at 80% or more wakes, and 79.9% does not on its own. I read it as the orchestrator must wake to wind down.
- Gap: a user note written straight into a ticket file, rather than through `board comment`, leaves no `events.jsonl` row, so the prelude can't see it.
- Proposed `.claude/agents/orchestrator.md` edit, not applied. In step 1 of the session-start list, replace `1. Check usage with \`usage-watch\`.` with:
  `1. Run \`node scripts/jev-wake-prelude.mjs --since last\` (ADR 0015 decision 6). In shadow it only logs \`jev\` rows; carry on whatever \`wake\` says. Then check usage with \`usage-watch\`.`
  In Rules, after `scripts/jev.mjs\` appends its own {"kind":"jev",...} rows (ADR 0010 decision 5); never write them by hand.` add: `\`scripts/jev-wake-prelude.mjs\` does the same for \`wake\` rows.`

## Next step
qa, verify mode, on feat/72-wake-gate-prelude. Then `risk-check` hits, so security.

## Suggested skills
organism-protocol, tdd (qa verify).

## Gotchas
- `node --test --test-reporter=dot` prints no totals. Use the default TAP reporter and grep `^# (tests|pass|fail)`.
- Don't run the CLI against the real board during a review. If no local condition wakes, it can call Jev and append real rows to `usage.jsonl`.
