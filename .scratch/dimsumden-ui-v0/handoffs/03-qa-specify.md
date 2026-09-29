```json
{"ticket": "dimsumden-ui-v0/03-metrics-script", "cell": "qa", "mode": "specify", "current_step": "6 failing tests committed at 0334cd4 on tests/dimsumden-ui-v0-03-metrics",
 "artifacts": ["scripts/metrics.test.mjs"],
 "decisions": ["CLI root is ORGANISM_ROOT or cwd; --json prints exactly computeMetrics output", "incident tool 'board comment' maps to board-comment; unmapped goes to other"],
 "failures": [],
 "pending": [{"item": "implement scripts/metrics.mjs (computeMetrics + CLI) to pass the tests", "owner": "developer"}]}
```

# Handoff: qa specify, dimsumden-ui-v0/03-metrics-script

## State
Done. 6 tests fail with "Cannot find module scripts/metrics.mjs" (the missing feature).

## What changed
Branch `tests/dimsumden-ui-v0-03-metrics` (base 571aafc), tests commit 0334cd4, file `scripts/metrics.test.mjs`.

Criterion to test map:
- Fixture produces the four keys: "fixture rows produce the four metric keys with the ADR values" (deepEqual whole object), "no resolved rows", "capped at the newest 24", "CLI --json over fixture files".
- Malformed lines skipped: "malformed lines are skipped, not fatal" (CLI, garbage in both files, exit 0).
- Text output without `--json`: "text output ... succeeds and is not empty".
- Human-verified: none.

## Decisions made
- Exports `computeMetrics({ usageLines, eventLines })` over parsed rows; the CLI reads `<ORGANISM_ROOT or cwd>/.scratch/{usage,events}.jsonl`, skips bad and blank lines.
- `usage` = latest `kind:"usage"` row by ts; `five_hour` -> `fiveHour`, `ts` -> `sampledAt`.
- "board comment" -> "board-comment"; "PowerShell Start-Job" -> "other"; tool "other" merges into "other".
- Cell rows for unresolved tickets are excluded.
- Not tested: `usage` with no usage row; other free-text mappings (e.g. "gh CI wait"); how eventLines feed metrics (fixture passes events, asserts nothing from them).

## Next step
developer implements `scripts/metrics.mjs`.

## Suggested skills
tdd, implement.

## Gotchas
Window starts are epoch-aligned 5h buckets: 19:00, 00:00, 05:00, 10:00 UTC in the fixture.
