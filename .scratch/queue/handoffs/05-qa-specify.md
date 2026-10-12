# Handoff: queue/05-decay-pick-and-unplanned-cap (qa specify)

```json
{
  "ticket": "queue/05-decay-pick-and-unplanned-cap",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Specify done: 21 tests in apps/organism-infra/queue-decay.test.mjs, committed at 47c0146 on tests/queue-05-decay-pick-and-unplanned-cap (not pushed by me). 13 fail for a missing feature, 8 pass already (see below). Next: developer makes the 13 pass.",
  "artifacts": [
    "branch tests/queue-05-decay-pick-and-unplanned-cap, commit 47c0146bbf7ba4b5b6e128db87c4e2ffaf9858bf",
    "apps/organism-infra/queue-decay.test.mjs"
  ],
  "decisions": [
    "Pinned buildQueue(...).expired as a plain array of refs: ready tickets outside the active feature whose decayLeft is 0 (5 resolved rows since readySince or the last pick). Whether they also stay in ordered is not pinned.",
    "Pinned the board pick row: {kind:'queue-pick', ts, top, picked, deviation?}; top is the Queue's top ref at pick time, deviation only with --deviation. board pick of an unknown ticket exits non-zero, stderr names it, writes nothing.",
    "Pinned that gate dry run and --apply cover expired tickets: dry run lists them with a reason naming decay and writes nothing; --apply parks only them (park event reason and ticket comment match /decay/i). Parked-by-decay does not need the 'admission gate: ' prefix.",
    "Pinned the unplanned cap in checkAdmission/gateRefusals: an Origin-added ticket is refused with a one-line reason matching /unplanned|cap/i when its feature has >= 3 planned tickets and the added tickets already filed are clearly past a third of planned. Boundary (count exactly planned/3) is NOT pinned. All statuses count, as in queue.unplanned. Security finding (Serves finding:<ref>) is never refused by the cap but is counted by it (queue.unplanned.added and the next ordinary ticket's check).",
    "Pinned that unpark restarts decay (ADR 0015 Amendment 3 Consequences, spec decision 9): after gate --apply parks a ticket and board unpark returns it, board queue shows decay 5. This needs loadSnapshot to treat an unpark event (op 'unpark', which carries 'to' not 'to_status') as a ready-since time. This one is derived from the ADR, not from the ticket's four criteria.",
    "Criterion map: (1) decay falls/resets: tests 1-4 and 'board queue shows decay falling ...'; (2) pick row and --deviation: 'board pick writes one queue-pick row', 'board pick --deviation records', 'board pick refuses an unknown ticket'; (3) gate lists expired in dry run, parks only with --apply: 'buildQueue expired ...' (2 tests), 'board gate dry run lists expired', 'board gate --apply parks expired', 'an unparked ticket restarts'; (4) cap: 'the unplanned cap ...' (5 tests), 'a security finding over the cap ...', 'gateRefusals lists a ticket over the cap ...', 'board gate lists a ticket over the unplanned cap ...'. No criterion is human-verified."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement: board pick (board.mjs), expired in buildQueue, gate dry run/--apply covering expired tickets, unpark restarting readySince in loadSnapshot, the unplanned cap in checkAdmission. Do not weaken queue-decay.test.mjs.",
      "owner": "developer"
    },
    {
      "item": "Light verify after the developer: run npm test, diff queue-decay.test.mjs against 47c0146, check the criterion map above.",
      "owner": "qa"
    }
  ]
}
```

## Tests that already pass (not red)

Tests 1-4 (decay count falls, pick resets, other pick does not, active feature never decays) and the cap's admit-side cases (under a third, fewer than 3 planned, planned ticket, other feature) pass on main because queue/02 already shipped `decayLeftFor` and no cap exists yet. They are guards against the developer breaking existing behavior, and the CLI test for criterion 1 still fails end to end because `board pick` is missing. The unknown-ticket pick test is red today: it asserts stderr names the missing ticket, which "unknown command: pick" does not. Totals at 47c0146: 13 fail, 8 pass (the 8 listed above).

## Failing reasons (all a missing feature, none a setup error)

expired always `[]`; no cap reason; `unknown command: pick`; gate ignores expired tickets. Run: `node --test apps/organism-infra/queue-decay.test.mjs`.

## Notes for the developer

- Test boards use past timestamps (2020) in usage.jsonl and events.jsonl so decay counts are deterministic; ready times come from events with `to_status: "ready-for-agent"`.
- The cap boundary is ambiguous in the ADR ("pass a third"). Pick a reading and say which in your handoff; the tests do not pin the exact-third case.
- Expired tickets in the active feature never expire; P0-tier outside the active feature is not tested either way.
