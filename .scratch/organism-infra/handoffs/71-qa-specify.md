```json
{"ticket": "organism-infra/71-jev-priority-scope-shadow", "cell": "qa", "mode": "specify",
 "current_step": "Done: 47 failing tests committed at 8bfcb8f on tests/71-jev-priority-scope-shadow",
 "artifacts": [
   "scripts/jev-priority.test.mjs (13 tests, point priority in jev.mjs)",
   "scripts/jev-scope.test.mjs (15 tests, point scope + rankFrontier)",
   "scripts/jev-priority-scope-report.test.mjs (19 tests, report extensions)"
 ],
 "decisions": [
   "priority labels: [mismatch, ok, other]; fallback no-line when no explicit **Priority:** Px line",
   "scope labels: [small, medium, large, other]; neither point has a dedicated reservation",
   "rankFrontier(tickets) export: sort by priority ASC, unblockCount DESC, scopeRank ASC, ticketNumber ASC",
   "tercile algorithm: baseline tokens per ticket from kind:cell rows, exclude 0, split into thirds",
   "priority go-live bar uses kind:jev-priority-verdict rows with right:boolean field",
   "scope go-live bar: >=60% same-tercile AND >=20 rows AND no small-was-large in last 10"
 ],
 "failures": [],
 "pending": []}
```

## State

Done. 47 failing tests across 3 files, committed at 8bfcb8f on `tests/71-jev-priority-scope-shadow`.

## Contracts pinned for the developer

### `jev.mjs` additions required

**`POINTS.priority`** (new entry):
- `labels: ["mismatch", "ok", "other"]`
- Early exit when no `**Priority:** P[0-3]` line in ticketText: `fail("no-line")`, cost 0
- Any model output outside the label set → "other" (same as route, not a fallback)
- Shadow: `actual = "orchestrator"` (the explicit line still orders the frontier)
- No dedicated reservation; draws from the $0.35 shared remainder

**`POINTS.scope`** (new entry):
- `labels: ["small", "medium", "large", "other"]`
- Any model output outside the label set → "other"
- Shadow: `actual = "orchestrator"`
- No dedicated reservation; draws from the $0.35 shared remainder

**`INPUTS` additions** (required so `decide` doesn't throw `INPUTS[point] is not a function`):
- `priority: (a) => a.ticketText`
- `scope: (a) => a.ticketText`

**`export function rankFrontier(tickets)`** (new export):
- `tickets: Array<{key, priority: 0|1|2|3, unblockCount, scope, ticketNumber}>`
- Sort: priority ASC → unblockCount DESC → scopeRank ASC → ticketNumber ASC
- `scopeRank`: small=0, medium=1, large=2, null|"other"=3
- Does not mutate the input array

**CLI**: "priority" and "scope" are valid points alongside "tier", "verify", "route", "route-bounce"

### `jev-report.mjs` additions required

**`buildReport(rows, events)`** returns two new fields:

`report.priority`:
- `rows`: count of `kind:"jev"` + `point:"priority"` rows
- `flagged`: rows where `pick === "mismatch"`
- `flagRate`: flagged / rows (0 when rows = 0)
- `checks.flagging`: PASS when ≥10 `kind:"jev-priority-verdict"` rows exist AND ≥70% have `right === true`

`report.scope`:
- `rows`: scope rows for tickets with non-zero baseline (has tercile ground truth)
- `sameTercile`: rows where Jev's label matches the tercile-derived label
- `sameTercileRate`: sameTercile / rows (0 when rows = 0)
- `smallWasLargeInLast10`: count in the most recent 10 scope rows where pick="small" and tercile="large", OR pick="large" and tercile="small"
- `checks.scope`: PASS when ≥60% same-tercile AND ≥20 rows AND `smallWasLargeInLast10 === 0`

**Tercile algorithm:**
- Collect baseline (sum of tokens from `kind:"cell"` rows) per ticket; exclude 0-baseline tickets
- Sort baselines ascending; bottom 1/3 → small, middle 1/3 → medium, top 1/3 → large (floor for boundaries)
- Recomputed fresh each call

**`kind:"jev-priority-verdict"` rows** (new kind in usage.jsonl):
- Shape: `{kind:"jev-priority-verdict", ticket, right: boolean, ts}`
- Written externally by the user review process; `buildReport` reads them for the go-live bar

**`formatReport(report)`** additions:
- `"priority flagging: PASS|FAIL (N verdicts, X% right; M flags)"`
- `"scope: PASS|FAIL (N rows, X% same-tercile, Y small-vs-large in last 10)"`

## Test count

| File | Tests | All fail |
|------|-------|----------|
| jev-priority.test.mjs | 13 | ✓ (INPUTS[point] is not a function) |
| jev-scope.test.mjs | 15 | ✓ (INPUTS/rankFrontier not a function) |
| jev-priority-scope-report.test.mjs | 19 | ✓ (report.priority/scope undefined) |

Existing tests (jev-route, jev-route-report, jev-route-bounce-report): 61 pass, 0 fail — unaffected.
