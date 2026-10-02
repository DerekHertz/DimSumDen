```json
{
  "ticket": "organism-infra/114-resolve-undo-foreign-lock",
  "cell": "developer",
  "current_step": "implemented in resolve(); the 2 red tests pass, all 18 board-resolve tests green, committed 9db4ab5 on fix/114-resolve-undo-foreign-lock",
  "artifacts": [
    "branch fix/114-resolve-undo-foreign-lock, commit 9db4ab5 (on qa's 2d6004a)",
    "apps/organism-infra/board-service.mjs (resolve() catch block only)"
  ],
  "decisions": [
    "Undo gate: the lock is read once with readFile(...).catch(() => null), so a lock that vanishes between the exists check and the read counts as no lock. Only a holder of orchestrator is force-released; any other holder is left untouched and named in the error (`; <ref> is held by <cell>, so its lock was left untouched`), with no 'put back' / 'claim undone' text.",
    "Resolved list: when the ticket reads resolved after the throw (release wrote it, usage append failed), the ref is pushed into done before rest is built, so it is listed under resolved: and excluded from not attempted.",
    "The `resolved: ...; not attempted: ...` tail format is unchanged."
  ],
  "failures": [
    "Full npm test run 1: 1814 tests, 1813 pass, 1 fail: apps/ui/src/overlay/floating-cards.test.mjs 'Ctrl+Enter in the Note sends Deny ...' (browser test, 'exactly one POST /requests, got []'). It passes when that file is run alone (33/33), so it looks like a load flake unrelated to this change."
  ],
  "pending": [
    {
      "item": "qa verify (light): rerun npm test; if floating-cards 'Ctrl+Enter in the Note' fails again, it is a separate flaky UI test to file, not part of 114.",
      "owner": "qa"
    }
  ]
}
```

## Summary

Change is limited to the catch block in `resolve()` in `apps/organism-infra/board-service.mjs` (19 insertions, 7 deletions). Tests were not touched. `board-resolve.test.mjs`: 18/18 pass, including the two that were red (114 AC1 foreign lock survives, 114 AC3 resolved ref listed after usage failure).

I skipped the parallel /code-review sub-agents: the diff is one catch block and I reviewed it by hand against the three ACs.

## Not done / out of scope

No other files changed. Did not touch ticket 108 files.
