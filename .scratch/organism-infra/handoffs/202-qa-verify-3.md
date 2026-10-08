# 202 qa verify handoff 3 (light re-verify of fix round 3)

Branch feat/202-conformance-spikes-round-4-fixes, head c60e449 (fix round 3 delta d6ea72d..c60e449, one commit). Verdict: QA pass, posted with `--verdict pass`. Ticket status stays `in-review`.

Scope of this run: the two bounce-2 findings in 202-qa-verify-2.md, checked against 202-developer-4.md. Light verify steps only.

Suite: `/tmp/202-tests.txt` used, not re-run (per orchestrator). 2639 pass, 0 fail, 0 skipped, 0 todo, 0 cancelled. The S6b tests in that file are listed as ok, including the new restore tests (ok 83, 84, 85).

## Bounce-2 findings

(a) S6b hook_started exclusion. Not touched in round 3. Still covered by conformance-round4.test.mjs:479-484, ok 77 in the suite. Passed in verify 2 by code trace; unchanged. PASS.

(b) S6b restore, throw path. Bounce-2 said the "throw" tests never threw. Round 3 renamed the two hang tests (conformance-s6b-restore.test.mjs:108 and :122, names now "a probe that never answers ..."; assertions unchanged, only comments and titles differ in the diff). Added real-throw tests:
- restore test l.132: throw mid-probe restores settings.local.json, allowed.txt (non-UTF-8) and denied.txt byte for byte, git status unchanged. Asserts `controlEvidence` matches /could not run the control/, so a throw is proven.
- restore test l.156: throw mid-probe removes the files the probe made when none existed before.
- restore test l.167: when restoring settings.local.json fails, allowed.txt and denied.txt are still restored and the failure is reported.

Code check: the throw comes from writeCaptures (conformance.mjs:1105, inside s6bAllowProbe), which runs inside the try at conformance.mjs:1126 of compareS6bAllow, before the finally at :1137. The fake's throwViaOut directory sits at out/S6b-compare-repo.jsonl, the path writeCaptures writes (conformance.mjs:1288). The developer's mutation runs (cited, not re-run here): with no restore, tests 5 and 6 fail; with the old unguarded sequence, only the per-restore guard test fails. PASS.

Per-restore guard: conformance.mjs:1137-1150. Each restore runs through restore(f, bytes) in its own try/catch. Failures are collected, the rest still run, and the finally throws an aggregated "S6b could not restore the main checkout: ..." after all of them. A zero-length Buffer is truthy, so an empty pre-existing file is still written back. PASS.

## Light-verify steps
1. Suite: taken from /tmp/202-tests.txt (lines 16461-16465: pass 2639, fail 0, cancelled 0, skipped 0, todo 0). No "not ok" test lines. Nothing skipped.
2. Test-file diff vs specify sha 3c3c1fc: `apps/bridge/cells/conformance-round4.test.mjs` shows 7 insertions, 0 deletions. Round 3 did not change this file. The specify assertions are unchanged. The developer-added `conformance-s6b-restore.test.mjs` is not a specify file; its round-3 diff (d6ea72d..c60e449) is 78 insertions, 8 deletions. The deletions are titles and comments of the two renamed hang tests, plus the replaced "throw" comments. No assertion was removed or loosened.
3. Criterion map: AC1-AC9 unchanged from verify 1 (per verify 2; not re-derived this round). Scope items from bounce 2: S6b hook_started exclusion maps to round4 test l.479-484. S6b restore maps to restore tests l.83 (pre-existing settings.local.json byte for byte), l.97 (absent file removed), l.108 and l.122 (hang path), l.132 and l.156 (real throw mid-probe), l.167 (per-restore guard), l.187 (pre-existing allowed.txt and denied.txt), l.209 (probe-made files deleted), l.218 (comparison reaches the main checkout). All scope items have a passing test.
4. Files touched outside the ticket's scope in round 3: `apps/bridge/cells/conformance.mjs` (13 insertions, 6 deletions, the finally block) and `apps/bridge/cells/conformance-s6b-restore.test.mjs` (developer-added file in the same directory, as in verify 1). Listed, not judged.

## Not done
- npm test was not re-run (orchestrator instruction). Mutation results are the developer's, cited above.
- Throw origin confirmed by reading the call path, not by a run.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light re-verify of fix round 3 done. Both bounce-2 findings resolved: real mid-probe throw tests added and passing, per-restore guard tested. Verdict pass posted with --verdict pass.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance-s6b-restore.test.mjs", "note": "l.132, l.156 real-throw restore tests; l.167 per-restore guard test; l.108, l.122 renamed hang tests"},
    {"path": "apps/bridge/cells/conformance.mjs", "note": "l.1137-1150 per-restore try/catch and aggregated throw in compareS6bAllow finally"},
    {"path": "apps/bridge/cells/conformance-round4.test.mjs", "note": "l.479-484 hook_started test; 7 insertions, 0 deletions vs 3c3c1fc; untouched in round 3"}
  ],
  "decisions": [
    {"decision": "Suite result taken from /tmp/202-tests.txt; npm test not re-run, per orchestrator instruction."},
    {"decision": "Throw origin confirmed by call-path reading plus developer's cited mutation runs, not re-run by qa."},
    {"decision": "QA pass on fix round 3. Ticket status left at in-review."}
  ],
  "failures": [],
  "pending": [
    {"item": "Orchestrator: open the PR and run the rest of the relay (risk-check, merge on green CI). Non-blocking note from verify 2 still stands: finally restores are now guarded, so no open item.", "owner": "orchestrator"}
  ]
}
```
