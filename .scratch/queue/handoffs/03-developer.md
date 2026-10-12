# Handoff: queue/03-admission-gate (developer)

```json
{
  "ticket": "queue/03-admission-gate",
  "cell": "developer",
  "current_step": "Implemented on tests/queue-03-admission-gate at b9b5403 (on top of qa's 4df65d9). All 33 admission-gate tests pass; test file untouched. Ticket released at in-review for qa verify, then full security (reads spec:<feature> text, parks tickets).",
  "artifacts": [
    "branch tests/queue-03-admission-gate (impl sha b9b5403)",
    "apps/organism-infra/frontier-queue.mjs (checkAdmission, gateRefusals, gateReason, Class/Serves parsers, specs/incidents/gateParks in loadSnapshot)",
    "apps/organism-infra/board.mjs (board gate [--apply])",
    "apps/organism-infra/board-service.mjs (createTicket: class, origin, serves, p0Reason; exports TICKET_CLASSES, TICKET_ORIGINS, P0_REASONS)"
  ],
  "decisions": [
    "A spec:<feature> name is only ever a key into snapshot.specs. loadSnapshot builds that map from the feature directories it lists itself (FEATURE_RE names), and reads .scratch/<feature>/spec.md only after lstat says plain file (no symlink followed, 1 MB cap). So ticket text never becomes a path. checkAdmission also refuses a spec feature that is not [a-z0-9-]+.",
    "The gate lists and parks every ready-for-agent ticket checkAdmission refuses, blocked or not (a ticket that unblocks later is already checked). Claimed, parked, resolved tickets are never touched. --apply parks one ticket at a time through setOffRelay with reason 'admission gate: <reasons joined by ; >'; a ticket claimed between listing and parking is reported on stderr and exit code 1, the rest still park.",
    "Gate parks are recognised by the reason prefix 'admission gate: ' on the ticket's last park event while its status is parked. board queue lists them under 'Parked by gate' with the prefix stripped; unpark/reopen/close drop them.",
    "Pipeline rule: Serves must still be valid and resolve (spec heading, existing incidents or existing finding ticket), then the ticket needs 3 distinct named incident ts sharing one tool, or an open active-feature ticket (not resolved or closed, any other status counts) listing it in Blocked by. A non-pipeline spec form must name the active feature; a pipeline one may name any feature with a spec.",
    "createTicket: class and origin stay optional (the den's task box calls it with neither). Origin defaults to 'added' when a class is given. A P0 needs p0Reason in main-red|relay-down|security-high whether or not a class is given; p0Reason with a non-P0 priority is refused. serves must be one line (no line terminator or control char, max 300 chars), so it cannot start a second header field.",
    "No `board create` subcommand was added: none existed, createTicket is the only writer, and a new CLI write path would widen the security review. The ticket's `board create --class ...` is createTicket's options."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Verify: criterion 6 is a number, read from this handoff (below). Full npm test result is in the cell report.",
      "owner": "qa"
    },
    {
      "item": "Full security review: the spec path handling in readSpecHeadings/checkServes and the park path in board.mjs gate.",
      "owner": "security"
    }
  ]
}
```

## Criterion 6: the three-incidents rule over the real usage.jsonl (2026-10-12, main checkout)

- `usage.jsonl` holds 482 `kind:"incident"` rows (329 distinct ts) across 130 distinct `tool` values; 34 tools have 3 or more rows.
- Ready organism-infra tickets: 10 (18 ready tickets in all). None carries a machine-form Serves, and none a Class line (the 7 Class lines on the board belong to queue tickets). **Organism-infra pipeline tickets that pass the three-incidents rule today: 0 of 10.** Even with Class backfilled as pipeline, 0 pass: every Serves is free text, so the gate refuses all 18 ready tickets on day one (as the architect expected). `board gate` dry run over the real board lists 18.
- The same-tool proxy is loose. `tool` "other" holds 122 of the 482 rows (a catch-all, not a cause), then git 18, Bash 16, board handoff 15, board release 14, Agent 13. A pipeline ticket citing any three "other" incidents passes. The rule checks form, not cause; if the user wants it tighter, exclude "other" (and probably generic names like Bash, Agent) from the tool match, or require the three to also share a `what` stem. Not changed here: the spec says same `tool`.

## Notes

- Tests: `node --test apps/organism-infra/admission-gate.test.mjs`: 33 of 33 pass.
- Reason lines are long on the real board because the quoted Serves text is clipped at 60 characters; the full reason is in the park comment and event.
