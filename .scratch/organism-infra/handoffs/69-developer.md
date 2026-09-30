# Handoff: developer, organism-infra/69

Branch `dev/69-jev-route-shadow`, commit 026e683 (on qa f6321cc). Not pushed. Status: blocked on one qa test.

## Result
62 of 63 tests pass across scripts/jev.test.mjs, jev-floor.test.mjs, jev-route.test.mjs, jev-route-report.test.mjs. All 39 new tests pass except one.

## The test that looks wrong
`scripts/jev-route-report.test.mjs:176` "formatReport prints per-label agreement and one PASS/FAIL line per go-live check". Data: 15 product picks dispatched to product, 2 architect picks dispatched to product. That is 15/17 = 88.2% agreement over non-other picks, other 0%. The test asserts `route new-ticket agreement: FAIL`. The test's own header contract (agreedPct >= 85 over non-other picks, other <= 35%) and ADR 0015 decision 5 both say PASS. The other agreement test (17/20 pass, 16/20 fail) agrees with the overall reading. Fix options for qa: change the assertion to PASS, or use data under 85% (for example 3 architect picks: 15/18 = 83.3%). I did not edit the test. The only alternative that would satisfy it is a per-label bar (every label at least 85%), which the ADR does not say.

## Files changed
- scripts/jev.mjs: `route` point; `offeredLabels`; `decide` options `codeTicket`, `forbid`, `status`; reserved budget (`RESERVED` 0.05 each for tier, verify, route; shared 0.35 inside the 0.50 cap); `fetchTransport` takes `labels` and sends criteria for exactly those; CLI accepts `route`.
- scripts/jev-report.mjs: `buildReport(rows, events)` returns `route.newTicket`; `formatReport` prints per-label agreement, four PASS/FAIL lines and disagreements; CLI reads `events.jsonl` next to `usage.jsonl`.

## Interpretation calls
- CLI code vs non-code: from the ticket's `**Type:**` first word. Non-code only for asset, research, review, grilling, design, design-direction, design-question, decision, prototype. Everything else, including task, chore, missing or unknown, is code (safe side: developer-direct is never offered on a code ticket).
- CLI reads `**Status:**` from the ticket and passes it as `status`.
- Text to Jev is ticket text only, through the existing redaction and blocked-input fallback. Never handoff or comment text (security ticket 67 pending). Note the ticket file's own `## Comments` section is part of the ticket file and is sent, as tier already does.
- Budget compare uses a 1e-9 epsilon so 0.40 - 0.05 counts as 0.35.
- Shadow route result omits `pick` and `conf`; a live-mode result carries them. `applied` is true only in live with a non-other pick; shadow is always false. No live-mode refusal added (not required).
- Report: rows with a fallback still count as rows when a dispatch exists; agreement uses only non-null non-other picks; `otherPct` is other over rows.

## State
```json
{"ticket":"organism-infra/69-jev-route-new-ticket-shadow-and-reserved-budget","cell":"developer","current_step":"Implemented; one qa test contradicts contract","artifacts":["scripts/jev.mjs","scripts/jev-report.mjs"],"decisions":["code vs non-code from Type","budget epsilon"],"failures":["qa test :176 contradicts contract"],"pending":[{"item":"qa fixes test at jev-route-report.test.mjs:176, then re-run the four jev files","owner":"qa"}]}
```
