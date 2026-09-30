# Handoff: qa specify, organism-infra/70

Branch: `tests/70-jev-route-bounce-shadow`, commit `7e642bf` (specify sha). Base `287ff6d`. Not pushed.

Test files (both new; no existing test touched):
- `scripts/jev-route-bounce.test.mjs` (decide unit tests + CLI tests)
- `scripts/jev-route-bounce-report.test.mjs` (buildReport bounce half + formatReport)

The pinned contract is in each file's header comment. Key choices: `bounceComment` is the raw text of the latest bounce verdict comment (the CLI reads it from events.jsonl `op:"comment"`, `verdict:"bounce"`); the 2,000-char cap is applied inside `INPUTS["route-bounce"]`; the row logs as `point:"route"`, `variant:"bounce"`; `report.route.bounce` mirrors `report.route.newTicket` in shape.

## Red state

`node --test scripts/jev-route-bounce.test.mjs`: 24 tests, 21 pass (all decide unit tests pass — `route-bounce` is already wired in `jev.mjs` via ticket 77), 3 fail:
- `CLI route-bounce is a valid point`: `main()` only accepts `tier|verify|route`, not `route-bounce`
- `CLI route-bounce reads the latest bounce verdict comment from events.jsonl`: same
- `CLI route-bounce: handoff sentinel not in bounce comment read by the CLI`: same
- (CLI still exits 2 on invalid arguments passes vacuously now; it will keep guarding after the change)

`node --test scripts/jev-route-bounce-report.test.mjs`: 0 pass, 21 fail — `report.route.bounce` is `undefined`, the feature is absent from `jev-report.mjs`.

All 70 pre-existing jev tests pass unchanged.

## Criterion-to-test map

1. **Label set / Criterion 1** — `jev-route-bounce.test.mjs`:
   - `route-bounce offered labels are exactly the bounce set (no developer-direct or product)`
   - `route-bounce: developer-direct is never offered`
   - `route-bounce: product, designer, qa-specify are not in the bounce label set`
   - `route-bounce: each valid label is stored in the row as-is`
   - `route-bounce: model output outside the label set maps to other, not a fallback`
   - `route-bounce: row is point route with variant bounce`

2. **Input shape + redaction / Criterion 2** — `jev-route-bounce.test.mjs`:
   - `route-bounce input includes the ticket and the bounce comment under a fixed delimiter`
   - `route-bounce: bounce comment is capped at 2000 chars`
   - `route-bounce: bounce comment beyond 2000 chars is cut so large ticket never drops the comment`
   - `route-bounce: secret in ticketText → blocked-input, zero transport calls`
   - `route-bounce: secret in bounceComment → blocked-input, zero transport calls`
   - `route-bounce: handoff sentinel in bounceComment does not come from handoff files`
   - `route-bounce blocked input makes no transport call and key stays out of the row`
   - `route-bounce: failures and blocked input fall back to orchestrator decides`
   - (CLI) `CLI route-bounce: handoff sentinel in a handoff file does not appear in the bounce comment read by the CLI`

3. **Safety / Criterion 3** — `jev-route-bounce-report.test.mjs`:
   - `bounce safety: developer pick followed by qa-verify and security is safe`
   - `bounce safety: developer pick without subsequent qa-verify before resolved is a safety miss`
   - `bounce safety: qa, architect, user picks do not require a verify chain`
   - `bounce safety: one miss keeps safety false even if other picks are clean`

4. **Report + go-live bar / Criterion 4** — `jev-route-bounce-report.test.mjs`:
   - `bounce report exists on report.route.bounce`
   - `bounce: agreement per label from the next board claim`
   - `bounce: only variant bounce rows count; new-ticket rows are excluded`
   - `bounce: only the latest bounce row per ticket counts`
   - `bounce: ticket with no dispatch yet is left out of every count`
   - `bounce: orchestrator claims and claims before the bounce row are not the dispatch`
   - `bounce: other picks are counted but excluded from agreement percentage`
   - `bounce: fallbacks counted apart from cap, excluded from agreement`
   - `bounce go-live bar passes: 8 rows, clean fallbacks, fast, 100% agreement, no safety miss`
   - `bounce coverage passes at 8 rows, fails at 7`
   - `bounce coverage: 1 fallback in 8 passes, 2 fails (at most 1 in 5)`
   - `bounce coverage fails when median ms is 2000 or more`
   - `bounce agreement: 85% of non-other picks passes, below fails`
   - `bounce agreement fails when other is more than 35% of rows`
   - `formatReport prints bounce per-label agreement and PASS/FAIL go-live lines`
   - `buildReport without bounce rows still has report.route.bounce with zero rows`
   - `bounce report does not affect the new-ticket report and vice versa`

5. **Shadow / Criterion 5** — `jev-route-bounce.test.mjs`:
   - `shadow result hides the pick and conf from the caller`
   - `live mode exposes the pick and sets applied true for non-other picks`
   - `live other means the orchestrator decides`
   - `route-bounce: row.actual is orchestrator in shadow mode`
   - (CLI) `CLI route-bounce is a valid point: exit 0, ... effective orchestrator, no pick shown`
   - Reserved budget: `route-bounce shares the route $0.05 reservation with new-ticket route` / `route-bounce still spends when route reservation is unspent`

Human-verified (not automatically testable):
- "Nothing routes live; no gate is touched." — confirmed by diff review: no `.claude/` or gate changes. The shadow tests assert `applied:false` and `effective:"orchestrator"`.

## What the developer must build

**`jev.mjs` CLI (`main()`)**:
1. Accept `route-bounce` as a valid `point` argument (alongside `tier|verify|route`).
2. Read the latest bounce verdict comment from `events.jsonl`: filter rows with `op:"comment"`, `verdict:"bounce"`, matching the ticket's feature and NN slug, take the last one by `seq` (or `ts`), pass its `text` as `bounceComment` to `decide`.
3. Update the usage/help string to mention `route-bounce`.

**`jev-report.mjs` (`buildReport`, `formatReport`)**:
1. Add `report.route.bounce` computed from rows with `variant:"bounce"` (mirrors `newTicket` logic).
2. Go-live bar: coverage threshold is 8 rows (not 15); all other checks identical to new-ticket.
3. Safety check: a `developer` pick is a miss when the ticket reaches `to_status:"resolved"` in events without a `qa` claim between the bounce-route row's `ts` and the resolve event. `qa`, `architect`, `user` picks are never a miss on their own.
4. `formatReport`: emit `route bounce coverage|agreement|safety|spend: PASS|FAIL ...` and `route bounce agreement <label>: <agreed>/<picks>` lines.

## Flags

- The `route-bounce` point (`POINTS["route-bounce"]`) and the `INPUTS["route-bounce"]` assembler are already present in `jev.mjs` (ticket 77). The developer only wires the CLI and the report.
- The `bounceComment` cap (2,000 chars) is already applied inside `INPUTS["route-bounce"]` via `BOUNCE_CAP`; no additional guard is needed.
- The safety rule (developer pick + no qa-verify before resolved = miss) is my interpretation of ADR 0015 decision 5 "a bounce label that would have skipped the verify or security stage the state machine requires". If the developer reads the rule differently (e.g., also checks security), they should leave a note but not remove the test.
- The `seq: ++seq` counter in the test helper resets per test file import but accumulates within the file; this is fine since events are sorted by `ts`, not `seq`, in the tests.

## State

```json
{
  "ticket": "organism-infra/70-jev-route-bounce-shadow",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/70-jev-route-bounce-shadow (7e642bf); 24 new tests, 21 decide tests green, 3 CLI red; 21 report tests red.",
  "artifacts": [
    "scripts/jev-route-bounce.test.mjs",
    "scripts/jev-route-bounce-report.test.mjs"
  ],
  "decisions": [
    "report.route.bounce mirrors report.route.newTicket in shape; coverage bar is 8 not 15",
    "Safety rule: developer pick + no qa claim before resolved = miss; qa/architect/user picks are not misses on their own",
    "CLI reads bounceComment from events.jsonl latest op:comment verdict:bounce row for the ticket"
  ],
  "failures": [],
  "pending": [
    {"item": "implement route-bounce CLI wiring and bounce report in jev-report.mjs", "owner": "developer"}
  ]
}
```
