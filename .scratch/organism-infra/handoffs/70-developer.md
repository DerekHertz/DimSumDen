# Handoff: developer, organism-infra/70

Branch `dev/70-jev-route-bounce-shadow`, commit `db370c0`, based on qa's specify commit `7e642bf`. Worktree `/home/dhertzell/dsd-70-qa`. Not pushed.

## What changed
- `scripts/jev.mjs`: the CLI accepts `route-bounce` (usage text updated). The new exported `latestBounceComment(eventsText, feature, slug)` returns the text of the last `op:"comment"`, `verdict:"bounce"` event for the ticket, taking the latest in append order. It matches on feature plus ticket NN. `main()` reads only `.scratch/events.jsonl` for this, never `handoffs/`, and passes the text to `decide` as `bounceComment`. The existing `INPUTS["route-bounce"]` (ticket 77) applies the 2,000-char cap, the delimiter, `hasSecret` blocked-input and the 16k tail cut.
- `scripts/jev-report.mjs`: `routeReport` now takes a variant (`new` or `bounce`), each with its own label map, coverage floor (15 or 8) and safety rule. `report.route.bounce` mirrors `newTicket`. `formatReport` prints `route bounce agreement <label>: a/p agreed` plus `route bounce coverage|agreement|safety|spend: PASS|FAIL` lines through a shared `goLiveLines` helper. The new-ticket output strings are unchanged.
- `scripts/jev-bounce-comment.test.mjs` (new, 5 tests): these check which comment the CLI selects: latest wins, pass verdicts, plain notes and non-comment ops are ignored, other tickets and features never leak in, and malformed input gives `""`. qa's CLI tests can't see the transport text without a key, which is why I added them.

## Results
- qa tests: `jev-route-bounce.test.mjs` 24/24 and `jev-route-bounce-report.test.mjs` 21/21, both unedited.
- `npm test`: 1019/1019 pass, 0 fail, 0 skipped.
- `npm run risk-check`: exit 1 with 3 hits, all in qa's test files (board code, shelling out, secrets handling). Security review is due under the relay.

## Criteria
1. Label set: checked. The set comes from ticket 77's `POINTS["route-bounce"]`, and anything else maps to `other`.
2. Input: checked. It's the ticket plus the latest bounce verdict comment from events.jsonl, never a handoff. Redaction and blocked-input still apply.
3. No skipped stage: checked as a report safety rule. A `developer` pick counts as a miss if the ticket resolved with no qa claim between the route row and the resolve.
4. Rows log `variant:"bounce"`, and the report prints per-label agreement and the 8-row go-live bar: checked.
5. Shadow: nothing routes live and no gate or `.claude/` file was touched. As with `route`, the CLI still accepts `--mode live` if a caller asks for it.

## Comments for the orchestrator
- The safety rule checks for a qa claim only, not security, because security runs only when risk-check hits. This is qa's reading of ADR 0015 decision 5, and I kept it.
- With no bounce verdict in events.jsonl, route-bounce still calls Jev with an empty verdict section. A `no-bounce` fallback would save spend, but it's outside the tested contract. Consider a follow-up.

## State
```json
{"ticket": "organism-infra/70-jev-route-bounce-shadow", "cell": "developer",
 "current_step": "Implemented and committed db370c0; npm test 1019/1019; released at in-review.",
 "artifacts": ["scripts/jev.mjs", "scripts/jev-report.mjs", "scripts/jev-bounce-comment.test.mjs"],
 "decisions": ["Bounce comment matched by feature + NN, latest by append order (seq is not monotonic in events.jsonl)", "routeReport parameterized per variant; new-ticket behavior and strings unchanged"],
 "failures": ["git add/commit launched in parallel raced on index.lock; retried sequentially"],
 "pending": [{"item": "qa verify, then security (risk-check hit)", "owner": "orchestrator"}]}
```
