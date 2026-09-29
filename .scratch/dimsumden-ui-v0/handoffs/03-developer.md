```json
{"ticket": "dimsumden-ui-v0/03-metrics-script", "cell": "developer", "mode": null, "current_step": "implemented, committed 99a4799, in-review",
 "artifacts": ["scripts/metrics.mjs"],
 "decisions": ["free-text tool mapping: normalize lowercase and hyphens, then fixed list; git/npm prefix, gh/ci prefix to ci, else other", "usage is null when no usage row", "windows run contiguous from oldest to newest resolved window, newest 24"],
 "failures": [],
 "pending": [{"item": "qa verify, then security", "owner": "qa"}]}
```

# Handoff: developer, dimsumden-ui-v0/03-metrics-script

## State
Done. Branch `feature/dimsumden-ui-v0-03-metrics`, commit 99a4799. The 6 qa tests pass; `npm test` 414/414.

## What changed
`scripts/metrics.mjs`: exports `computeMetrics`, `parseJsonl`, `formatText`; the CLI reads `<ORGANISM_ROOT or cwd>/.scratch/{usage,events}.jsonl`, skips malformed lines, prints text or `--json`.

## Decisions made
See the json block. `eventLines` is accepted but unused in v0. No dependencies added. I ran a light self-review only, not the full /code-review skill.

## Next step
qa verify.

## Gotchas
The TOOLS list is duplicated from `scripts/log-cell.mjs` (not exported there); keep them in step.
