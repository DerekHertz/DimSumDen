```json
{
  "ticket": "dimsumden-ui-v0/02-priority-module",
  "current_step": "qa specify done: failing tests committed",
  "artifacts": [
    "tests/dimsumden-ui-v0-02-priority",
    "apps/organism-infra/priority.test.mjs"
  ],
  "decisions": [
    "Interface: parsePriority(md), orderFrontier(candidates, handoffTimestamps); handoff counts only if strictly after readySince; ticket number compared numerically"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Create apps/organism-infra/priority.mjs; decide stacking of bumps (6+ handoffs) and record the day-only handoff-name rule",
      "owner": "developer"
    }
  ]
}
```

# Handoff: dimsumden-ui-v0/02 qa specify

## State
Branch `tests/dimsumden-ui-v0-02-priority`, one commit adding `apps/organism-infra/priority.test.mjs`. Run with `node --test apps/organism-infra/priority.test.mjs`. It fails now with ERR_MODULE_NOT_FOUND for `./priority.mjs`, the missing feature.

## Interface the tests fix (ADR 0011 gave the shape, not the names)
- `parsePriority(ticketMarkdown) -> "P0".."P3"`. Reads the bold `**Priority:** Pn` header line. Missing, malformed (P4, "urgent", empty, bare "P"), or unbolded gives P2. A mention in a Comments bullet must not override the header.
- `orderFrontier(candidates, handoffTimestamps) -> [{ref, priority, effectivePriority, bumps, bumped}]` in frontier order. Candidates are `{ref, priority, readySince}`. Input must not be mutated.

## Criterion to test map
- Missing line is P2, malformed line: the `parsePriority:` table.
- P0 can't be bumped: "bump: P0 can never be bumped".
- Bump counted from orchestrator handoffs only: "bump:" tests count only timestamps newer than readySince. The caller filters orchestrator files (that is the snapshot builder, ticket 04), so this module never sees other handoffs. The 2-vs-3 threshold, before-readySince, exact-equal, unsorted and empty cases are covered.
- Frontier order test: "frontier order:" tests cover priority, then age, then numeric ticket number, plus bumped and cross-feature cases.
- No criterion is human-verified.

## Decisions I made that the developer must follow (ambiguities)
- A handoff counts only when strictly after `readySince`.
- Ticket number is the leading digits of the ref's slug, compared numerically (`20` before `100`).
- Bump size is fixed only at 3 handoffs -> 1 level. I did not test 6+ handoffs (stacking) because the ticket text does not say; the developer should pick and record it. Untested: P3 with 9 handoffs.
- The day-only handoff file name issue (ADR consequence) is not tested here: the function takes ISO timestamps. Whoever builds the list (ticket 04) must decide how to convert names; ticket 02 should record the rule in the module header.

## Comments
None.
