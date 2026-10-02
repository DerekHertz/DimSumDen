# Handoff: 87 qa verify

```json
{
  "ticket": "organism-infra/87-dispatch-context-script",
  "cell": "qa",
  "mode": "verify",
  "current_step": "All tests pass (1425 pass, 0 fail, 0 skipped). All acceptance criteria have passing tests. No tests removed or loosened. QA pass.",
  "artifacts": [
    "scripts/dispatch-context.test.mjs (tests refactored and enhanced)",
    "scripts/jg.test.mjs (two new tests appended)",
    "Test run: 1425 pass, 0 fail, 0 skipped"
  ],
  "decisions": [
    "5 MB boundary refactor (jg files → trackedBytes seam) is legitimate implementation change; preserves spec (5242881 blocks, 5242880 proceeds)",
    "New exclusion test verifies seam receives only tracked files (ADR 0014 decision 3)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "User applies .claude diff from developer handoff (two edits to orchestrator.md)",
      "owner": "user"
    }
  ]
}
```

## Verification summary

All 1425 tests pass with 0 failures and 0 skipped (developer reported 1425 pass, 0 fail; verified).

### Test changes (specify commit 28246fd → HEAD e7dfb64)

Files changed within scope:
- `scripts/dispatch-context.mjs` (new, 198 lines)
- `scripts/dispatch-context.test.mjs` (+21 lines net; one test refactored, two tests added)
- `scripts/jg.mjs` (+13 lines; in-process `flags` extension)
- `scripts/jg.test.mjs` (+22 lines; two new tests appended)

No files touched outside ticket scope.

### Tests not removed or loosened

- Refactored test: "skip: jg files reports..." → "skip: tracked files total more than 5 MB..." (boundary preserved at 5242881/5242880)
- Added test: "the size check is handed tracked files only, not .scratch/ or .claude/" (seam test for exclusion)
- Added tests in jg.test.mjs: "runJg forwards in-process flags..." (ok 1139) and "runJg refuses an in-process flag..." (ok 1140)

All assertions intact; refactoring uses a valid seam injection (trackedBytes) instead of relying on jg's files command (ADR 0014 decision 7 compliance).

### Acceptance criteria → tests

1. **Script behaviour matches ADR 0014 decisions 3 and 7 (tests)**
   - Decision 3 (interface, skip rules, fallback handling):
     - ok 726: happy path, context file and jg row
     - ok 109 (line 109): question building, excludes .scratch/
     - ok 123 (line 123): 1500 char limit
     - ok 132 (line 132): 24 KB cap, 90 s timeout, NODE_USE_ENV_PROXY=1
     - ok 162 (line 162): path skip rules
     - ok 737: 5 MB boundary (refactored)
     - ok 738: tracked files exclusion (new)
     - ok 234 (line 234): secret scan in root
   - Decision 7 (test seam: run function):
     - Tested throughout via the fake() injected run function and all above tests
     - ok 1139, ok 1140: in-process flags extension tested through runJg seam

2. **A jg failure exits cleanly with no context file, so dispatch proceeds without it (test)**
   - Fallback test suite (all write no file, record reason, exit 0):
     - jg missing (line 212)
     - not authenticated (line 213)
     - non-zero exit (line 214)
     - timeout (line 216)
     - incomplete output (line 217)
     - secret in output (line 218)
   - CLI-level: ok 750 "CLI: a jg failure exits 0 with no context file and a fallback reason"
   - CLI-level: ok 339 (line 339) "CLI: jg not installed exits 0, no file, fallback names it"

3. **`.claude` diff in the developer handoff**
   - Provided in developer handoff (sections "Edit 1" and "Edit 2" in 87-developer.md)
   - Orchestrator applies; not an automated criterion

## Comments

All acceptance criteria have passing tests; no tests were deleted or weakened. The 5 MB boundary refactor (jg files → trackedBytes seam) is a legitimate implementation change that preserves the spec (still blocks at 5242881, proceeds at 5242880). The new exclusion test verifies the seam receives only tracked files, as specified in ADR 0014 decision 3.

**QA pass**

