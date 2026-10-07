```json
{"ticket": "organism-infra/165-context-budget-hook-hardening", "cell": "qa", "mode": "specify",
 "current_step": "DONE. Ran scripts/hooks/context-budget.hardening.test.mjs and the two edited 162 files on tests/batch-c-context-budget (HEAD b1c8093, no changes this round). The three 165 fixes each have a test that fails for the missing fix; the control tests pass.",
 "artifacts": ["scripts/hooks/context-budget.hardening.test.mjs", "scripts/hooks/context-budget.test.mjs (edited, 27/27 pass)", "scripts/hooks/context-budget.scratchpad.test.mjs (edited, 4/4 pass)"],
 "decisions": ["Red (3): test 1 backslash-escaped quote hiding a chain (hook allowed it, exit 0); test 5 a .scratch/ outside the main checkout (main/src/.scratch was allowed); test 8 invalid session_id '../sess' (hook still read context and refused with exit 2 instead of failing open)", "Green controls (5): test 2 plain wrap-up commands allowed; 3 and 4 main checkout .scratch allowed via worktree list and via ORGANISM_ROOT; 6 climbing path refused; 7 session scratchpad allowed. These guard the developer against over-tightening", "Tests unchanged this round; criterion map in 165-qa-specify.md still accurate", "Verify will see the diff in the two edited 162 files, explained in 145-qa-specify-2.md; thresholds and assertions are unchanged"],
 "failures": [],
 "pending": [{"item": "Developer implements the three 165 fixes in scripts/hooks/context-budget.mjs along with 145 (same branch and PR)", "owner": "developer"}]}
```

## State
Specify complete for 165 on branch `tests/batch-c-context-budget`. See 145-qa-specify-2.md for the whole batch.
