# Handoff: queue/03-admission-gate (qa specify)

```json
{
  "ticket": "queue/03-admission-gate",
  "cell": "qa",
  "mode": "specify",
  "current_step": "33 failing tests written and committed at 4df65d9 on tests/queue-03-admission-gate (base 0046e7e). All 33 fail for a missing feature (checkAdmission not exported, no board gate command, createTicket ignores the new options), none for import or setup errors.",
  "artifacts": [
    "branch tests/queue-03-admission-gate (specify sha 4df65d9)",
    "apps/organism-infra/admission-gate.test.mjs"
  ],
  "decisions": [
    "checkAdmission is imported through a namespace in the test so a missing export fails each test with a TypeError, not the whole file at link time.",
    "Snapshot shape pinned (header of the test file): ticket gains class ('product'|'pipeline'|null) and serves (raw text after **Serves:**, null if absent); snapshot gains specs {feature: [heading text]} and incidents [{ts, tool}]. Result is {ok, reasons[]}; ok true gives reasons [].",
    "Rules tested: class required; Serves must be spec:<feature> \"<heading>\" | incident:<ts>[, ...] | finding:<ref>; product spec must be the active feature's and match a heading line case-insensitively; pipeline needs 3 distinct incident ts sharing one tool, unless an open active-feature ticket lists it in Blocked by (ADR 0019 decision 8); P0 needs p0Reason.",
    "Header lines are read from the header block only (above the first '## '); a Class or Serves line planted in the body or a blockquote is ignored.",
    "Parked-by-gate list: tested only end to end (gate --apply, then board queue lists those tickets with their reasons; a ticket parked by hand with an unrelated reason is not listed; unpark removes it). How the gate park is recognised is the developer's choice (for example a reason prefix).",
    "createTicket options pinned: class, origin, serves, p0Reason. Origin defaults to 'added' when a class is given. P0 needs p0Reason in main-red|relay-down|security-high (ADR 0015 Amendment 3, decision on Priority P0). A newline in serves must not create a second header line (refuse or neutralise).",
    "There is no `board create` subcommand today; the ticket's `board create --class ...` is tested at createTicket, the only place a ticket file is written. Adding a CLI subcommand is optional and untested."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement to make the tests pass: checkAdmission and the Class/Serves parsers plus specs/incidents in loadSnapshot (frontier-queue.mjs), gate and gated list (board.mjs, buildQueue), createTicket options (board-service.mjs). Do not edit the test file; dispute a test in the handoff if it is wrong.",
      "owner": "developer"
    },
    {
      "item": "Criterion 6 is human-verified: the developer's handoff reports how many organism-infra pipeline tickets pass the three-incidents rule over the real usage.jsonl. Verify reads the number; there is no test.",
      "owner": "qa"
    }
  ]
}
```

## Criterion to test map

1. checkAdmission per decisions 6 and 7, with reasons: the first 14 tests ("checkAdmission ..."), plus the loadSnapshot-with-checkAdmission tests.
2. Pipeline ticket blocking the active feature: "a pipeline ticket that blocks an active-feature ticket is admitted ..." and "... only a ticket outside the active feature does not get the exemption", plus the Blocked by reader test.
3. `board gate` dry run writes nothing, `--apply` parks with reasons: "board gate with no flag ...", "... nothing to park ...", "--apply parks each refused ticket ...", "--apply a second time ...", and "board queue lists the tickets parked by the gate ...".
4. createTicket lines and P0 refusal: the six "createTicket ..." tests.
5. Spec path cannot leave .scratch/: "a spec path control", "a spec path with .. segments or an absolute path ...", "a spec path through a symlink ...". Each probe plants a file with the matching heading outside .scratch/, so a gate that follows the path would admit.
6. Real usage.jsonl count: human-verified.

## Notes

- `node --test apps/organism-infra/admission-gate.test.mjs`: 33 tests, 0 pass, 33 fail (as intended).
- Not pinned, left to the developer: blocked-but-failing ready tickets (the gate may include or skip them); `queue-admit` rows (ticket 04); the `finding:` form beyond "the ticket must exist"; whether createTicket requires `class`.
- Ticket 03's own Serves line is free text; the gate refuses all 13 ready tickets on day one, as the architect expected.
