# Handoff: organism-infra/93 QA verify

## State

```json
{
  "ticket": "organism-infra/93-batch-groups-script",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify complete: test file unchanged since a6e68e6, all 27 tests pass (1624 total pass), no out-of-scope files touched. Acceptance criteria mapped to tests.",
  "artifacts": [
    "scripts/batch-groups.mjs (implemented by developer, commit ce0845a)"
  ],
  "decisions": [],
  "failures": [],
  "pending": []
}
```

## Criteria-to-test map

All acceptance criteria covered by passing tests:

1. **Two tickets that share a path are grouped; two that share none are not**
   - Tests: "two tickets that share a path are grouped; a third that shares none is single", "paths in Acceptance criteria count; paths in Comments or outside backticks do not", ".scratch/ and .claude/ paths are ignored, so such a ticket is unknown", "a path overlap groups tickets across features", "a chain of overlaps forms one connected group (A-B share p1, B-C share p2)", "a group names its shared path (not an unshared one) and gives a reason"

2. **A group is capped at `--max` and split by shared paths**
   - Tests: "a component over the cap is split by most shared paths", "no group exceeds max and every ticket lands exactly once (five tickets on one path, max 3)", "max defaults to 3", "CLI --max caps the group size; the default is 3"

3. **A ticket whose path overlaps an in-flight branch's files is left single; with the seam failing, groups are still printed and the output notes no in-flight data**
   - Tests: "a group whose shared path is in an in-flight branch is left single", "any path of a group's tickets (even an unshared one) overlapping in-flight drops the group", "in-flight files that touch none of the group's paths leave it grouped", "with no in-flight data (null) groups are still formed and the result says so", "CLI: a failing in-flight seam still prints groups and notes no in-flight data (exit 0)", "CLI: a ticket overlapping an in-flight branch's files is printed single", "CLI --json with a failing in-flight seam reports inFlight.available false"

4. **A ticket with no paths appears under `unknown files` only; blocked, locked and non-ready tickets are skipped**
   - Tests: "a ticket with no paths is under `unknown` only, never grouped", "blocked, locked and non-ready tickets are skipped entirely (not even listed)", "a ticket whose blockers are all resolved is eligible", "a ticket with one unresolved blocker among several is skipped", "CLI text: group line, then singles, then `unknown files`; skipped tickets absent; exit 0"

5. **Code and asset tickets are never grouped together**
   - Tests: "code and asset tickets are never grouped together", "code ticket types mix: task, fix and chore sharing a path group together"

6. **`--json` output parses and matches the text grouping; bad arguments exit 2**
   - Tests: "CLI --json: one parseable object that matches the text grouping", "CLI bad arguments exit 2 and never call a seam", "running the script with a bad argument exits 2"

7. **The orchestrator genome edit is written into the developer's handoff for the user to apply**
   - human-verified: Orchestrator genome edit provided in developer handoff, section "Orchestrator genome edit (for the user to apply)"

## Files changed

Only `scripts/batch-groups.mjs` was touched by the developer (added). No files outside the ticket scope.

## Test results

- npm test: 1624 pass, 0 fail
- Test file unchanged since specify (git diff a6e68e6 HEAD -- scripts/batch-groups.test.mjs returns no output)
- All 27 batch-groups tests pass
