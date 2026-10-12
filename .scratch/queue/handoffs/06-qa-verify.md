# Handoff: queue/06-retire-old-order (qa verify, light)

```json
{
  "ticket": "queue/06-retire-old-order",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify of developer commit 6d1098f on tests/queue-06-retire-old-order: QA pass. Next: npm run risk-check (orchestrator).",
  "artifacts": [
    "branch tests/queue-06-retire-old-order at 6d1098f (specify sha 9091262, base 0046e7e)",
    "scripts/retire-old-order.test.mjs (unchanged since specify)",
    "scripts/queue.test.mjs (unchanged since specify)",
    "scripts/queue-fixture.mjs (unchanged since specify)",
    "apps/organism-infra/priority.test.mjs (unchanged since specify)",
    "apps/bridge/bridge-state.test.mjs (unchanged since specify)"
  ],
  "decisions": [
    "Verify mode light, per the dispatch line and the qa specify handoff.",
    "Step 1 used the developer's saved full npm test output (scratchpad 06-tests.txt), not a fresh npm test run, because the dispatch said not to re-run the suite."
  ],
  "failures": [],
  "pending": [
    {
      "item": "npm run risk-check, then the orchestrator opens the PR and merges on green CI.",
      "owner": "orchestrator"
    }
  ]
}
```

## Light verify steps

1. Suite: saved output shows `# tests 4312`, `# pass 4312`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`. Passes.
2. Test-file diff: `git diff 9091262 HEAD` is empty for the five qa test files (`scripts/retire-old-order.test.mjs`, `scripts/queue.test.mjs`, `scripts/queue-fixture.mjs`, `apps/organism-infra/priority.test.mjs`, `apps/bridge/bridge-state.test.mjs`). No assertion removed or loosened.
3. Criterion to test map (names checked as `ok` in the saved output):
   - AC1 `jev.mjs order` exits 2, no rankFrontier/orderRow: `scripts/retire-old-order.test.mjs` "AC1 jev.mjs order exits 2 as an unknown command...", "AC1 jev.mjs no longer exports rankFrontier or orderRow...", "AC1 no source file, test files included, names rankFrontier or orderRow".
   - AC2 queue.mjs ready list in buildQueue order: `scripts/queue.test.mjs` "Q6 ready holds the frontier in the Queue's order...", "Q6 ready rows carry a 1-based rank...", "Q6 plain output lists READY in the Queue's order..."; `scripts/retire-old-order.test.mjs` "AC2 no source file reads jev-order rows".
   - AC3 no aging bump, UI snapshot builds: `apps/organism-infra/priority.test.mjs` "no aging: 3 handoffs after readySince no longer lift P2 to P1", "no aging: many handoffs leave every level where it is"; `apps/bridge/bridge-state.test.mjs` "no aging (queue/06)...".
   - AC4 handoff lists every jev-order reader: human-verified (marked at specify). Developer handoff `06-developer.md` gives the list.
   - AC5 issue-tracker.md describes the Queue order: `scripts/retire-old-order.test.mjs` "AC5 the Frontier paragraph of issue-tracker.md describes the Queue order...". Wording is human-verified.
   - AC6 `npm test` passes: saved output as in step 1.
4. Files touched outside the ticket's listed scope (listed, not judged):
   - `apps/bridge/bridge-fixture.mjs` (stale comment)
   - `apps/ci-cd/smoke-ui.mjs` (stale comment)
   - `scripts/jev-advisory-cli.test.mjs` (order cases removed; specify decision 4 names these)
   - `scripts/jev-advisory-report.test.mjs` (orderRow cases removed; specify decision 4 names these)
   - No file deleted outside the ticket scope. `scripts/jev-order.test.mjs` is deleted, which the ticket lists.

## Not proven

- Step 1 was not re-run. The saved output is the developer's run on 6d1098f, which the dispatch named as the suite result.
- AC4 and AC5 wording are not checked by a test.
