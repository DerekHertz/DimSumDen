# 160 qa verify handoff

```json
{
  "ticket": "organism-infra/160-jev-verify-baseline",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify passed. npm test: all 2126 pass, 0 fail, 0 skipped. Tests stable: git diff 93d323e HEAD on test files shows no changes. Criterion coverage: both acceptance criteria covered by passing tests in scripts/jev-shadow-baseline.test.mjs (tests 7 and 8 directly; tests 1-6 and 9 are supporting guards). Developer modified only scripts/jev.mjs (in scope) to implement light baseline for verify after qa specify.",
  "artifacts": [
    {"path": "scripts/jev-shadow-baseline.test.mjs", "note": "9 tests, all passing; covers both criteria with supporting tests and guards"}
  ],
  "decisions": [
    "Verified scripts/jev.mjs fix: baseline variable set to light for point=verify when qaSpecified !== false, else p.fallback (full). Matches test expectations.",
    "Test file edits (qaSpecified: false at lines 82, 141 in scripts/jev.test.mjs) were made at specify phase. No test changes between specify and verify; assertions intact.",
    "All 9 new shadow baseline tests pass. Guards for live mode unchanged and other ticket handoffs ignored (test 9) are green."
  ],
  "failures": [],
  "pending": [
    {
      "item": "risk-check on feat/160-jev-verify-baseline (aad879a)",
      "owner": "orchestrator"
    }
  ]
}
```

## Test criterion map

Test file: `scripts/jev-shadow-baseline.test.mjs` (9 tests total)

**Acceptance criterion 1:** Shadow verify reports `effective: light` for a ticket with a published qa specify handoff (test with a fixture board)
- Passing test: "CLI shadow verify with a published qa specify handoff: effective light" (test 7)
- Supporting tests: "shadow verify with qa specify: effective is light, not the fallback" (test 1), "stays light when Jev picks full" (test 2), "stays light when Jev falls back" (test 3), "qaSpecified omitted counts as specified (default true)" (test 5)

**Acceptance criterion 2:** It reports `effective: full` for a ticket without one (test)
- Passing test: "CLI shadow verify without a qa specify handoff: effective full" (test 8)
- Supporting tests: "shadow verify without qa specify: effective is full with the floor logged" (test 4)
- Guard: "CLI shadow verify ignores another ticket's qa specify handoff (16- is not 160-)" (test 9)

**Additional guard:** "live verify is unchanged: Jev's pick applies when specified" (test 6) — confirms no side effects to live mode.

## Scope

Files touched (git diff 93d323e..aad879a):
- `scripts/jev.mjs` (4 lines: 3 insertions, 1 deletion) — in scope

Test files reviewed for changes (no modifications):
- `scripts/jev-shadow-baseline.test.mjs` — stable
- `scripts/jev.test.mjs` (lines 82, 141 edited at specify phase) — stable since specify

No files outside ticket scope.

