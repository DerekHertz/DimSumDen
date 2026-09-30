# Handoff: qa specify, organism-infra/69

Branch: `qa/69-jev-route-tests`, commit f6321cc (specify sha). Base a82420e. Not pushed.

Test files (both new; no existing test touched):
- `scripts/jev-route.test.mjs` (decide, fetchTransport, CLI)
- `scripts/jev-route-report.test.mjs` (buildReport, formatReport)

The pinned contract is in each file's header comment. The developer implements against it. Key choices are mine, since the ticket does not fix them: `codeTicket` (default true), `forbid`, `status` and `variant` options on decide; `labels` on the transport request; row.pick is the raw label; row.actual "orchestrator"; fallback "state-machine"; `buildReport(rows, events)` returning `report.route.newTicket`.

## Criterion to test map
1. Closed label set, other maps: "code ticket: offered labels...", "non-code ticket...", "any output outside the label set maps to other", "a forbidden label the model returns anyway maps to other", "fetchTransport sends route criteria for exactly the offered labels", "route returns the label in the row".
2. Never fires where state machine dictates; forbidden labels removed; no developer-direct on code ticket: "state machine dictates the next cell", "ready-for-agent (or no status) does call", "forbid removes labels", "code ticket is the default", CLI "in-review ticket".
3. Logs label; stdout hides pick: "route returns the label in the row", "shadow result hides the pick", "live other means the orchestrator decides", CLI "route without a key ... no pick shown". Actual dispatch from board: claim events do carry `cell` (events.jsonl `op:"claim"`, checked against real events), so no orchestrator-logged `actual` is needed. Report tests: "agreement per label from the next board claim", "developer claim maps to developer-direct", "orchestrator claims and claims before...", "no dispatch yet", "only variant new counts", "formatReport prints per-label agreement".
4. Reserved budget: five "reserved budget" tests (shared exhausted, over-reservation with spent shared, over-reservation with unspent shared, other points' overflow, tier/verify same rule), "total cap still binds", "budget counts only today's". Fallback: "failures and blocked input fall back", "state machine...", cap tests assert `fallback:"cap"`.
5. Go-live lines: "go-live bar passes", "coverage fails under 15", "coverage: 3 fallbacks...", "median ms", "agreement: 85%", "other more than 35%", "safety: developer-direct...", "fallbacks are counted apart from cap" (spend), "formatReport prints ... PASS/FAIL line".
6. Nothing routes live, no gate touched: shadow tests assert applied false and effective "orchestrator". No live-mode refusal is tested (ticket does not require one). Otherwise human-verified by diff review (no `.claude/` or gate changes).

## Red state
`node --test` on the 4 jev files: 63 tests, 24 pass (all pre-existing jev and jev-floor tests), 39 fail (all new tests). New tests fail with TypeError from `POINTS.route` being undefined and from `report.route` missing: the feature is absent, not a setup error. One new test, "CLI still exits 2 on invalid arguments for route", passes vacuously now because `route` is an unknown point (exit 2); it will keep guarding after the change.

## Flags
- Security ticket 67 (what text may be sent to Jev): tests use ticket text only, plus blocked-input on a secret pattern. Nothing depends on 67's verdict except the bounce half (ticket 70), untested here. If 67 narrows redaction rules for ticket text, the blocked-input tests may need revisiting.
- Interpretations to confirm: the "spend" check is "no route row with fallback cap" (ADR: "never exhausted for a reason other than heavy use" is not machine-checkable); the safety check flags developer-direct where a qa claim exists on the ticket; `user` picks never have a board claim, so they only count toward agreement when a mappable claim exists; unmapped cells (security, scout, herald) are ignored as dispatch.
- Rows with no `point` count only against shared budget; old cap tests still pass under that rule.
- CLI decides code vs non-code ticket somehow (unspecified; the developer picks a rule, e.g. from `**Type:**`). Not tested at the CLI, only via `codeTicket` on decide.

## State

```json
{
  "ticket": "organism-infra/69-jev-route-new-ticket-shadow-and-reserved-budget",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on qa/69-jev-route-tests (f6321cc); 39 new tests red, 24 existing green.",
  "artifacts": [
    "scripts/jev-route.test.mjs",
    "scripts/jev-route-report.test.mjs"
  ],
  "decisions": [
    "Pinned route contract in test headers"
  ],
  "failures": [],
  "pending": [
    {"item": "implement route point, reserved budget, report", "owner": "developer"}
  ]
}
```
