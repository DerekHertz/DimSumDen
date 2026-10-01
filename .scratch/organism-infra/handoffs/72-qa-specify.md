# Handoff: 72 – qa specify

```json
{
  "ticket": "organism-infra/72-jev-wake-gate-prelude-shadow",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing acceptance tests committed on tests/72-wake-gate-prelude; developer can start.",
  "artifacts": [
    "scripts/jev-wake-prelude.test.mjs",
    "scripts/jev-wake-report.test.mjs"
  ],
  "decisions": [
    "AC6 (input allowlist) already covered by exposure.test.mjs; no new test added.",
    "Seam: codeDecides() + runPrelude() exports in jev-wake-prelude.mjs; report.wake in jev-report.mjs."
  ],
  "failures": [],
  "pending": []
}
```

**cell:** qa  
**mode:** specify  
**branch:** tests/72-wake-gate-prelude  
**commit:** 5f6c91b  
**ticket:** organism-infra/72-jev-wake-gate-prelude-shadow

## What was done

Wrote failing acceptance tests for the wake-up gate prelude (ADR 0015 decision 6). All tests fail for the right reason (missing feature), not a setup or syntax error.

## Test files

| File | Covers |
|------|--------|
| `scripts/jev-wake-prelude.test.mjs` | AC1–AC4, AC6 |
| `scripts/jev-wake-report.test.mjs` | AC5 |

## Criterion-to-test map

**AC1 – prelude decides code-decidable conditions without calling Jev:**
- `codeDecides: frontier non-empty returns wake:true with a reason string`
- `codeDecides: frontierCount 0 does not wake`
- `codeDecides: usage at 80% wakes; 79% does not`
- `codeDecides: CI red wakes`
- `codeDecides: merge conflict wakes`
- `codeDecides: open user-verdict gate request wakes`
- `codeDecides: no condition → wake:false`
- `runPrelude: code condition wakes immediately, Jev is not called`

**AC2 – code wakes on user/Scope-added/verdict comments (ADR 0015 decision 6):**
- `runPrelude: user-authored comment wakes without calling Jev`
- `runPrelude: 'Scope added' comment wakes without calling Jev`
- `runPrelude: verdict comment wakes without calling Jev`
- `runPrelude: comment with no author (unknown) wakes without calling Jev`

**AC3 – only ambiguous inputs call Jev; other/failure wakes:**
- `runPrelude: cell-authored non-verdict comment calls Jev exactly once`
- `runPrelude: 'needs-claude' label wakes the orchestrator`
- `runPrelude: 'informational' label does not wake`
- `runPrelude: 'other' label wakes the orchestrator`
- `runPrelude: Jev failure (no API key) wakes the orchestrator`
- `runPrelude: one needs-claude among multiple informational inputs → overall wake`
- `runPrelude: no inputs (nothing ambiguous) → wake:false`

**AC4 – shadow logs rows; no daemon, no timer:**
- `runPrelude: logs a jev row for each Jev call, row.point is 'wake'`
- `runPrelude: code-wake inputs produce no jev rows`
- `runPrelude: resolves to a plain object (no retained timer)`
- `CLI: jev-wake-prelude.mjs exits within timeout when run with no arguments`

**AC5 – wake go-live bar in jev-report.mjs (ADR 0015 decision 6):**
- `buildReport includes a report.wake object with checks`
- `coverage passes with 15 non-fallback rows and medianMs < 2000`
- `coverage fails with fewer than 15 rows`
- `coverage fails when more than 1 in 5 rows are non-cap fallbacks`
- `coverage fails when medianMs >= 2000`
- `cap fallbacks count toward capFired but not fallbacks`
- `safety passes when no informational row is followed by an orchestrator action`
- `safety fails when orchestrator claims a ticket labeled informational after the wake row`
- `safety fails when orchestrator comments on a ticket labeled informational after the wake row`
- `safety is not affected by events before the wake row`
- `needs-claude rows never count as missed wakes`
- `spend passes when no cap rows appear`
- `spend fails when any cap row appears`
- `informational count reflects rows with pick 'informational' only`
- `formatReport prints 'wake coverage: PASS' and 'wake safety: PASS' and 'wake spend: PASS'`
- `formatReport prints 'wake coverage: FAIL' when coverage fails`
- `formatReport prints 'wake safety: FAIL' when a missed wake exists`

**AC6 – input sent = what ticket 67 allowed:** Already covered by `exposure.test.mjs` tests for the `wake` point (`wake: decide handles the point and includes new comment but not handoff text`). No new test needed.

## Modules the developer must create/extend

1. **`scripts/jev-wake-prelude.mjs`** (new): Export `codeDecides(ctx)` and `runPrelude(args)`. The `runPrelude` function calls `jev.decide({point:"wake", ...})` for ambiguous inputs (not caught by `codeWakes`). Returns `{ wake, reason, rows }`. Must exit as a CLI script (no daemon, no timer).

2. **`scripts/jev-report.mjs`** (extend): Add `report.wake` to `buildReport()` with coverage/safety/spend checks (see pinned contract in `jev-wake-report.test.mjs`). Add `wake coverage: PASS|FAIL`, `wake safety: PASS|FAIL`, `wake spend: PASS|FAIL` lines to `formatReport()`.

## Pinned contract key points

- `codeDecides` wakes on: `frontierCount > 0`, `usagePct >= 0.8`, `ciRed`, `conflicted`, `openVerdictRequest`.
- `runPrelude` checks `codeDecides` first, then `codeWakes` (from `jev.mjs`) per input, then calls `decide({point:"wake"})` only for ambiguous inputs.
- Safety check: `informational` rows where a board event (claim/comment/release) on the same ticket appears after `ts` → missed wake.
- Coverage bar: `rows >= 15`, `fallbacks * 5 <= rows`, `medianMs < 2000`. Cap rows count toward `capFired`, not `fallbacks`.

## Failed calls

None.

## Worktree receipt

Worktree: `/home/dhertzell/dsd-72-specify`  
Status: clean (only test files committed)
