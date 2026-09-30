# Handoff: organism-infra/69 qa verify (full)

## State

```json
{
  "ticket": "organism-infra/69-jev-route-new-ticket-shadow-and-reserved-budget",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify done: QA pass at a4f8a2e. 929 tests, 928 pass, 1 known cloud failure, 0 skipped.",
  "artifacts": ["scripts/jev-route.test.mjs", "scripts/jev-route-report.test.mjs", "scripts/jev.test.mjs", "scripts/jev-report.test.mjs", "scripts/jev-floor.test.mjs"],
  "decisions": ["Only test change since f6321cc is the two-line agreement fix (15/18 = 83.3%) in jev-route-report.test.mjs", "Files touched: scripts/jev.mjs, scripts/jev-report.mjs only, both in scope"],
  "failures": ["npm test: usage.mjs is unchanged locally: no credentials still exits 1 with a usage: error (known cloud env issue)"],
  "pending": []
}
```

## Steps
1. `npm test`: 929 tests, 928 pass, 1 fail (the known usage.mjs no-credentials test), 0 skipped. The jev route, route-report, jev and jev-report files: 60 tests pass, none skipped.
2. `git diff f6321cc HEAD -- '*.test.mjs'`: only scripts/jev-route-report.test.mjs changed, 2 lines: `batch(2,...)` to `batch(3,...)` and `0/2` to `0/3`. Exactly the allowed fix; the FAIL threshold (85%) is untouched.
3. Criteria map:
   - label set, other exit: jev-route.test.mjs "any output outside the label set maps to other", "code ticket / non-code ticket offered labels"
   - state machine dictates, forbid, developer-direct never on code: "state machine dictates the next cell", "forbid removes labels before the call", "a forbidden label the model returns anyway maps to other", "code ticket is the default"
   - logs label, shadow hides pick, report agreement per label: "route returns the label in the row", "shadow result hides the pick and conf", CLI route test, jev-route-report "agreement per label from the next board claim" (events carry cell type, so no `actual` logging needed)
   - reserved budget, fallbacks: "reserved budget: ..." (7 tests), "failures and blocked input fall back", cap fallback tests
   - go-live bar pass/fail lines: jev-route-report go-live, coverage, agreement, safety, spend, formatReport tests
   - nothing routes live, no gate touched: "live" tests only in unit seam; diff touches no gate file. No human-verified items.
4. Implementation review vs ticket and ADR 0015: shadow result deletes pick and conf, `applied` false unless live (route CLI passes shadow by default); reserved $0.05 x3 and $0.35 shared inside $0.50 cap; only ticketText sent to Jev; CLI type rule lists non-code types and defaults to code; diffs minimal, no dead code.
5. Interpretation calls: spend check is "no cap hits", a proxy for ADR "never exhausted except heavy use". A non-`ready-for-agent` status (including `claimed`) yields fallback state-machine, per "fresh ticket only". Non-blocking.
