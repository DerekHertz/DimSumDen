# Handoff: organism-infra/93 qa specify

## State

```json
{
  "ticket": "organism-infra/93-batch-groups-script",
  "cell": "qa",
  "mode": "specify",
  "current_step": "27 failing tests committed on feat/batch-groups93 (a6e68e6, base 27f6a82). 26 fail with ERR_MODULE_NOT_FOUND (scripts/batch-groups.mjs missing), 1 (subprocess bad-arg) fails on exit status; all for the missing feature.",
  "artifacts": [
    "scripts/batch-groups.test.mjs (branch feat/batch-groups93, commit a6e68e6)"
  ],
  "decisions": [
    "Seams are fixed by the header of scripts/batch-groups.test.mjs: groupTickets({tickets, inFlight, max}) pure, and main(argv, {readBoard, inFlightFiles}) -> {code, stdout, stderr}. The developer must export both from scripts/batch-groups.mjs and guard the real process entry like dispatch-context.mjs does.",
    "readBoard returns EVERY ticket {ref, text, locked}; groupTickets filters (ready-for-agent, unlocked, every Blocked by resolved) and parses Type/Status/Blocked by from text. Blocked by uses same-feature numbers ('01, 02') or 'None...'. A blocker missing from the list counts as unresolved.",
    "A group is dropped to singles when ANY path of ANY of its tickets (not only shared paths) is in an in-flight branch's files. This is my reading of 'any of its paths'; the orchestrator can overrule.",
    "Skipped tickets (blocked, locked, non-ready) appear nowhere in the output, including unknown files.",
    "inFlight null (seam failed) -> result.inFlight.available false, and the text carries a line matching /no in-flight data/i; JSON carries inFlight.available.",
    "Text output needs one line per group holding all its refs, its shared paths and the reason; singles; then a line containing 'unknown files' before the unknown refs.",
    "Not tested because the ticket leaves it open: the 'known directory' path form (only paths with a slash and an extension are tested), cross-feature full-ref Blocked by ('feat/NN-slug'), the exact split result when a component of 4 has max 3, the default gh/git seam (needs a real remote)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement scripts/batch-groups.mjs (groupTickets, main, default readBoard over the main-checkout board and default gh-based inFlightFiles that rejects on gh failure) so scripts/batch-groups.test.mjs passes; never loosen the tests",
      "owner": "developer"
    },
    {
      "item": "Write the exact orchestrator genome edit (name `node scripts/batch-groups.mjs [--max 3] [--json]` in the Batches section) into the developer handoff for the user to apply; .claude/ is gated",
      "owner": "developer"
    }
  ]
}
```

## Criterion-to-test map

All tests are in `scripts/batch-groups.test.mjs`.

1. Two tickets that share a path are grouped, two that share none are not:
   - "two tickets that share a path are grouped; a third that shares none is single"
   - "a group names its shared path ... and gives a reason", "a path overlap groups tickets across features", "a chain of overlaps forms one connected group"
   - Path extraction: "paths in Acceptance criteria count; paths in Comments or outside backticks do not", ".scratch/ and .claude/ paths are ignored ..."
2. Cap at `--max` and split by shared paths:
   - "a component over the cap is split by most shared paths", "no group exceeds max and every ticket lands exactly once", "max defaults to 3", "CLI --max caps the group size; the default is 3"
3. In-flight overlap leaves a ticket single; seam failure notes no in-flight data:
   - "a group whose shared path is in an in-flight branch is left single", "any path of a group's tickets ... drops the group", "in-flight files that touch none of the group's paths leave it grouped", "with no in-flight data (null) ...", "CLI: a failing in-flight seam still prints groups and notes no in-flight data", "CLI: a ticket overlapping an in-flight branch's files is printed single", "CLI --json with a failing in-flight seam ..."
4. No-path ticket under `unknown files` only; blocked, locked, non-ready skipped:
   - "a ticket with no paths is under `unknown` only", "blocked, locked and non-ready tickets are skipped entirely", "a ticket whose blockers are all resolved is eligible", "a ticket with one unresolved blocker among several is skipped", "CLI text: group line, then singles, then `unknown files` ..."
5. Code and asset never grouped together:
   - "code and asset tickets are never grouped together", "code ticket types mix: task, fix and chore ..."
6. `--json` parses and matches text; bad arguments exit 2:
   - "CLI --json: one parseable object that matches the text grouping", "CLI bad arguments exit 2 and never call a seam", "running the script with a bad argument exits 2"
7. Genome edit written into the developer's handoff: `human-verified` (not automatable; qa verify reads the developer's handoff for the exact edit text).

## Run

`node --test scripts/batch-groups.test.mjs`: 27 tests, 27 fail, 0 pass. 26 with `ERR_MODULE_NOT_FOUND`, 1 on the subprocess exit status.
