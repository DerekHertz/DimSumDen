```json
{
  "ticket": "organism-infra/71-jev-priority-scope-shadow",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Done: QA pass, 1073/1073, all ACs covered, no specify tests weakened",
  "artifacts": [
    "scripts/jev-priority.test.mjs (13 specify tests, unchanged since 8bfcb8f)",
    "scripts/jev-scope.test.mjs (15 specify tests, unchanged since 8bfcb8f)",
    "scripts/jev-priority-scope-report.test.mjs (19 specify tests, unchanged since 8bfcb8f)",
    "scripts/jev-order.test.mjs (7 developer tests, new)"
  ],
  "decisions": [
    "tercile edge: Math.round(n/3) is correct; specify handoff comment said floor but test data encodes round — tests win",
    "orderRow: no AC requires it to be wired; AC2 only requires the logging function to exist; orchestrator wiring is downstream",
    "jev-priority-verdict rows: no AC requires this ticket to write them; reading them for the go-live bar is what AC4 specifies"
  ],
  "failures": [],
  "pending": []
}
```

## Verdict

**QA pass**

## Checks

### 1. Test suite
Saved run `/tmp/71-tests.txt`: **1073 pass, 0 fail, 0 skipped**. No skipped tests.

### 2. Specify tests diff
`git diff 8bfcb8f HEAD -- scripts/jev-priority.test.mjs scripts/jev-scope.test.mjs scripts/jev-priority-scope-report.test.mjs` → **empty**. None of the three specify files were touched.

### 3. AC coverage map

| Acceptance criterion | Covered by |
|---|---|
| AC1: Priority mismatch flag emitted only where explicit line exists; no line fills in v1 | `jev-priority.test.mjs` (13 tests) |
| AC2: Scope labels small/medium/large/other; combined order in code, never crosses P-level; actual order logged beside would-have-used | `jev-scope.test.mjs` (15 tests) + `jev-order.test.mjs` tests 1–3 |
| AC3: jev-report.mjs computes terciles, recomputed each run, excluding 0-baseline; reports flag rate, same-tercile rate, small-vs-large misses in last 10 | `jev-priority-scope-report.test.mjs` (19 tests) |
| AC4: Go-live bars (flagging ≥70%/10; fills ≥80%/20; scope ≥60%/20 and no small-was-large in last 10) encoded as pass/fail lines | `jev-priority-scope-report.test.mjs` + `jev-order.test.mjs` (fills bar test) |

No AC is human-verified; all are testable and tested.

### 4. Developer's new test file (`scripts/jev-order.test.mjs`, 7 tests)
Tests cover: orderRow with explicit actual (compares wouldHave), orderRow default-actual (P-level + ticket number), orderRow same=true, priority fills bar FAIL at 0 verdicts, fills bar PASS at ≥20 / ≥80%, input allowlist (only ticketText sent for priority and scope), CLI `--ticket` required error for both points. All assertions are concrete behavior checks, not implementation details. None loosen or replace any specify assertion.

### 5. Files changed (base 05c1240 → 987d10d)
- `scripts/jev.mjs` — in scope
- `scripts/jev-report.mjs` — in scope
- `scripts/jev-priority.test.mjs` — specify file, unchanged
- `scripts/jev-scope.test.mjs` — specify file, unchanged
- `scripts/jev-priority-scope-report.test.mjs` — specify file, unchanged
- `scripts/jev-order.test.mjs` — developer's new test file, in scope

**No out-of-scope files.**

## Rulings

### Tercile edge: floor vs Math.round(n/3)
**Math.round(n/3) is correct.**

The qa specify handoff comment said "floor for boundaries", but the test data at `scripts/jev-priority-scope-report.test.mjs:220` encodes `i < 7 ? "small" : i < 13 ? "medium" : "large"` for n=20 tickets with baselines 10–200. That boundary (7 small, 6 medium, 7 large) matches `Math.round(20/3)=7`, not `Math.floor(20/3)=6` (which would give 6 small, 7 medium, 7 large). The 19-ticket test (`i < 6 ? "small" : i < 13 ? "medium" : "large"`) is also consistent with `Math.round(19/3)=6`.

ADR 0015 decision 4 says only "terciles … recomputed each report, 0-baseline tickets excluded" — it does not specify floor vs round. The ticket acceptance criterion is likewise silent. The tests are the authoritative encoding of the algorithm; the handoff comment was imprecise. **No correction needed in the code; the developer's implementation is correct.**

### orderRow: does any AC require it to be called automatically?
**No.** AC2 says "actual order logged beside the would-have-used order." `orderRow` implements that logging function. The acceptance criterion does not require that jev-order rows appear automatically in `usage.jsonl`; that wiring is an orchestrator concern downstream of this ticket. The developer correctly deferred it.

### jev-priority-verdict rows: does any AC require this ticket to write them?
**No.** AC4's go-live bar reads `kind:"jev-priority-verdict"` rows for the flagging check. Writing those rows is a user review step; nothing in AC4 says this ticket produces them. The bar correctly FAILs (0 verdicts) until the review step is in place, which is the specified shadow behavior.

## Comments

QA pass.

## State

Done.

## Failed calls

None.
