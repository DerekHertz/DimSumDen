# 142 qa verify (full): QA bounce on a pre-existing out-of-scope red test

```json
{
  "ticket": "organism-infra/142-steering-adapter-pure",
  "cell": "qa",
  "mode": "verify",
  "verify_type": "full",
  "current_step": "Verdict: QA bounce. The adapter's own tests are green, but npm test has one failure outside this ticket's scope. npm test at 79df91a: 2558 tests, 2557 pass, 1 fail, 0 skipped, 0 todo, 0 cancelled (scout run; run twice, both exit 1). The failure is scripts/jev-hardening.test.mjs:230 'Low-80: runJg is refused when checkout param is omitted and root has no .git ancestor'. qa reran that file alone: 13 pass, 1 fail, same error. The branch does not touch scripts/ (git diff --stat f19e4b6 79df91a -- scripts is empty), so the red is inherited from the base. The test expects a jg.mjs change that is not made. The adapter file alone (node --test apps/bridge/cells/claude-adapter.test.mjs): 74 tests, 74 pass, 0 fail.",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.mjs (branch feat/142-steering-adapter-pure @ 79df91a)",
    "apps/bridge/cells/claude-adapter.test.mjs (unchanged since specify sha 8756d90)",
    "apps/bridge/cells/fixtures/s1.jsonl, s2.jsonl, s3-allow.jsonl, s3-deny.jsonl, s4b-eof.jsonl, s6b.jsonl, s8.jsonl (unchanged since 8756d90)"
  ],
  "decisions": [
    "Full verify, not light: the developer asked for light, but the specify tests were written by an earlier qa cell, and this qa cell did not write them. The genome allows light only for the cell that ran specify.",
    "Specify sha 8756d90. git diff 8756d90 79df91a touches only apps/bridge/cells/claude-adapter.mjs. No diff to the test file or fixtures since specify: no removed or loosened assertion.",
    "Scope: the branch diff vs f19e4b6 touches only the adapter, its test file and the 7 fixtures. Nothing outside the ticket's scope.",
    "Criterion 1 (whole-argv equality, no broadening flag): test line 57 (literal base() list), line 89 (broadening-flag list over every role and model), line 105 (only template flags). Covered; the expected values are literals, not recomputed.",
    "Criterion 2 (--setting-sources project,local, --strict-mcp-config, inline deny in --settings): test lines 69 and 76 (deny JSON literal). Covered.",
    "Criterion 3 (decode against fixtures, including duplicate request_id and non-can_use_tool subtype): decode tests lines 480-534 use the real S3 fixtures; duplicate id at 506; non-can_use_tool subtypes at 526. Covered.",
    "Criterion 4 (fixtures have no home paths or usernames): tests at lines 707 and 721. Independent grep of all 7 fixtures for dhertzell, /home/, /Users/, C:\\Users found nothing. The one path is /tmp/den-conformance-EggAXp/s3-allow.txt (test line 486), a temp path.",
    "No criterion is human-verified.",
    "Not done: a line-by-line review of claude-adapter.mjs against ADR 0016 6.5, 6.6, 6.8 beyond what the 74 tests check. The tests were the check; this is a limit of this qa run (haiku tier)."
  ],
  "failures": [
    {
      "where": "scripts/jev-hardening.test.mjs:230",
      "test": "Low-80: runJg is refused when checkout param is omitted and root has no .git ancestor",
      "error": "Missing expected rejection: runJg must refuse when there is no .git ancestor and no explicit checkout param (AssertionError at line 236)",
      "why": "Pre-existing red inherited from the base: the test expects an unimplemented jg.mjs change. Out of scope for 142."
    }
  ],
  "pending": [
    {
      "item": "Orchestrator: decide whether the Low-80 red is waived for 142 (inherited, not from this branch) or fixed on main first. Reconcile the developer's handoff ('npm test 2558 pass 0 fail') with this run (2557 pass, 1 fail).",
      "owner": "orchestrator"
    },
    {
      "item": "If not waived: the developer must not fix scripts/jg.mjs on this branch without scope approval; that fix belongs to a jg ticket.",
      "owner": "orchestrator"
    }
  ]
}
```

Numbers: npm test 2558 tests, 2557 pass, 1 fail, 0 skipped, 0 todo. Adapter file alone 74 of 74 pass. The full scout log is in the scratchpad, not published.
