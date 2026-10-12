# Handoff: queue/06-retire-old-order (qa specify)

```json
{
  "ticket": "queue/06-retire-old-order",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests committed on tests/queue-06-retire-old-order (9091262), all red for a missing feature. Next: developer makes them pass and removes the old code and tests.",
  "artifacts": [
    "branch tests/queue-06-retire-old-order (specify sha 9091262, base 0046e7e)",
    "scripts/retire-old-order.test.mjs (new)",
    "scripts/queue.test.mjs (rewritten: ready order, rank, proposed, jev-order ignored)",
    "scripts/queue-fixture.mjs (test helper: new `headers` option)",
    "apps/organism-infra/priority.test.mjs (aging tests replaced by no-aging tests)",
    "apps/bridge/bridge-state.test.mjs (bump test replaced by no-aging test)"
  ],
  "decisions": [
    "scripts/queue.mjs contract: the ready list is in buildQueue order (loadSnapshot(root) then buildQueue), filtered to the tickets queue.mjs calls ready (locked tickets stay in flight). Each ready row has rank = its 1-based position in that filtered list; proposed = the same tickets as [{ref,title,rank}]. Every ready ticket is ranked now (no jev-order row, no usage.jsonl needed). jev-order rows are ignored. Plain output marks each READY line with the rank mark.",
    "priority.mjs contract: orderFrontier keeps its return shape { ref, priority, effectivePriority, bumps, bumped } so the UI snapshot and queue-model keep working, but effectivePriority always equals priority, bumps is 0, bumped is false. Order stays priority, readySince, number. handoffTimestamps is still accepted and unused.",
    "Dropping the aging bump needs no change in apps/bridge/snapshot.mjs beyond what falls out of priority.mjs (its callers only read the bump fields, which still exist). Comments in apps/bridge/bridge-fixture.mjs (07-bumpable) and apps/ci-cd/smoke-ui.mjs (line 23) still describe a bump and are stale; the head order 02, 07, 08 is unchanged.",
    "The 'no source names rankFrontier or orderRow' scan covers test files too. The developer must delete scripts/jev-order.test.mjs, the rankFrontier cases in scripts/jev-scope.test.mjs, and the orderRow cases in scripts/jev-advisory-report.test.mjs ([S1] tests, lines about 159 to 185 plus header comments) and scripts/jev-advisory-cli.test.mjs (the three CLI order tests near line 126 to 155). Those are removals of tests for removed code, as the ticket says; qa verify should treat exactly those deletions as expected.",
    "The 'no source reads jev-order' scan skips *.test.mjs files, so tests may plant a jev-order row to show it is ignored. After the change only history in usage.jsonl and docs/ADRs mention it."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the tests pass: remove rankFrontier, orderRow, the `order` point and its usage text from scripts/jev.mjs; drop the aging bump from apps/organism-infra/priority.mjs; switch scripts/queue.mjs to buildQueue; rewrite the Frontier bullet in docs/agents/issue-tracker.md (names Queue, active feature, unblock count; no 'moves up one level'). In the handoff list every reader of jev-order rows from a full-repo search (criterion 4, human-verified).",
      "owner": "developer"
    }
  ]
}
```

## Criterion to test map

1. `jev.mjs order` exits 2 and no code calls rankFrontier or orderRow: `scripts/retire-old-order.test.mjs` ("AC1 jev.mjs order exits 2...", "AC1 jev.mjs no longer exports...", "AC1 no source file ... names rankFrontier or orderRow").
2. queue.mjs ready list in buildQueue order: `scripts/queue.test.mjs` "Q6 ..." (10 tests: order, rank/proposed, locked ticket, active feature, P0 with reason, jev-order ignored, no usage.jsonl, unknown active feature, plain-output order and marks, marks only on ready). Literal expected lists, checked against buildQueue output in a probe. `scripts/retire-old-order.test.mjs` "AC2 no source file reads jev-order rows". The mods-queue band tests still pass unchanged (proposed shape kept).
3. No caller depends on the aging bump; UI snapshot builds: `apps/organism-infra/priority.test.mjs` ("no aging", two frontier-order tests), `apps/bridge/bridge-state.test.mjs` ("no aging (queue/06)", plus the existing snapshot tests).
4. Handoff lists every reader of jev-order rows from a full-repo search: human-verified (content of the developer's handoff). My own search found (excluding usage.jsonl and events/artifacts): scripts/queue.mjs (the only code reader), scripts/jev.mjs (writer), tests in scripts/queue.test.mjs, jev-advisory-*.test.mjs, jev-order.test.mjs, docs/adr/0015, .claude/agents/orchestrator.md and .codex/agents/orchestrator.toml (name the command and row; the genome edit is ticket 07), .scratch handoffs and tickets. Not checked: .scratch/ tooling beyond grep, the bridge at runtime.
5. issue-tracker.md describes the Queue order: `scripts/retire-old-order.test.mjs` "AC5" checks the terms Queue, active feature, unblock and absence of the aging sentence; wording quality is human-verified.
6. `npm test` passes: the whole suite.

## Run

On the specify branch, `npm test`: 4311 pass, 19 fail, 0 skipped. 18 failures are the new red tests (all fail on missing behavior, not syntax). One, `npm run smoke:ui passes on main` (apps/ci-cd/smoke-ui.test.mjs), failed in the full run but passes when run alone; likely load or flake, not caused by these tests. The developer should re-run it alone before treating it as theirs. `GET /state on a fixture tree (no claim lock)` fails on the new no-aging test only.

## Not proven

- That smoke:ui flakes under full-suite load; I saw one failure and one pass.
- The queue.mjs behavior for a ready ticket blocked by a closed or parked ticket (queue.mjs counts it ready; buildQueue does not order it). Left unspecified; the developer should put such tickets after the ordered ones in board order and say so in the handoff.
