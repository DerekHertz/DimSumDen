```json
{
  "ticket": "organism-infra/114-resolve-undo-foreign-lock",
  "cell": "qa",
  "mode": "specify",
  "current_step": "specify done: 4 tests added to apps/organism-infra/board-resolve.test.mjs, 2 red for the right reason, committed 2d6004a on fix/114-resolve-undo-foreign-lock",
  "artifacts": [
    "branch fix/114-resolve-undo-foreign-lock, commit 2d6004a (base ace9c5d)",
    "apps/organism-infra/board-resolve.test.mjs (tests appended after the 98 docs test)"
  ],
  "decisions": [
    "The foreign-lock race is made deterministic with a named pipe (mkfifo) at <root>/.scratch/usage.jsonl: the resolved-row append for ref 01 blocks in open() until the test drains it, so a developer claim on ref 02 lands exactly between validation and resolve's claim. Skipped only on win32.",
    "Mid-batch failure after a claim is made with a ticket in another feature whose handoffs path is a regular file (publishHandoff fails after claim).",
    "Usage-append failure is made with a directory at .scratch/usage.jsonl (EISDIR after release wrote resolved).",
    "The failure report is parsed from the trailing `resolved: a, b; not attempted: c` text (the current message format), with `none` meaning an empty list."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the 2 red tests pass: undo only when the lock's claiming cell is orchestrator; push a ref into done when release wrote resolved but the usage append failed. Keep every existing test green.",
      "owner": "developer"
    }
  ]
}
```

## Summary

Four tests appended to `apps/organism-infra/board-resolve.test.mjs`. `npm test`: 1814 tests, 1812 pass, 2 fail (the two new red ones), 0 skipped.

## Criterion to test map

| AC | Test | State |
|---|---|---|
| 1. A foreign lock claimed mid-batch survives a failed resolve, untouched | `114 AC1: a foreign lock claimed mid-batch survives a failed resolve, untouched` | RED: the developer's lock is deleted (actual null, expected the developer lock text) |
| 2. A mid-batch failure undoes only the orchestrator's own claim and reports resolved / not attempted refs | `114 AC2: a mid-batch failure undoes only the failing ref's own orchestrator claim ...` and `114 AC2: a failure on the first ref undoes its claim and reports nothing resolved` | GREEN already (regression guards for the existing undo and report; the ticket asked for these tests) |
| 3. A ref whose release wrote resolved appears in resolved: even if the usage append failed | `114 AC3: a ref whose release wrote resolved is listed under resolved: even when the usage append failed` | RED: report says `resolved: none`, expected `sample/01-do-thing` |
| 4. `npm test` green | not a test; verify runs it | n/a |

No criterion is human-verified.

## What the tests pin

- AC1: after the developer claims ref 02 mid-batch, resolve exits non-zero, the developer's lock file is byte-identical, ticket 02 is byte-identical (no status reset, no comment), no release event is logged for 02, stderr has no "put back" / "claim undone", and the report is `resolved: sample/01-do-thing; not attempted: none`.
- AC2: ref 01 stays resolved with its usage row; the failing ref (other feature) is back at in-review with no lock; refs after it are untouched and unlocked with no release events; report lists resolved and not-attempted refs exactly. Second test: first-ref failure gives `resolved: none` and all later refs not attempted.
- AC3: two refs, usage.jsonl is a directory. 01 is resolved on disk, error mentions "resolved row was NOT written" and the log-resolved redo hint, 02 untouched, report is `resolved: sample/01-do-thing; not attempted: sample/02-other-thing`.

## What the developer must change (apps/organism-infra/board-service.mjs, resolve(), ~1314-1331)

1. Undo gate: read the lock before the undo (`claimingCell(await readFile(paths.claimLockPath, "utf8"))`) and call the forced `release` only when the cell is `orchestrator`. For any other holder, change nothing and say so in the message (do not write "put back" or "claim undone"). Read the lock content once and tolerate it vanishing between the exists check and the read.
2. Resolved list: when the ticket reads `resolved` after the failure (release wrote it but the usage append threw), add `ref` to `done` before building the `resolved:` list. The existing `readStatus(content) !== "resolved"` check already skips the undo for that case. `rest` must still exclude it.
3. Keep the `resolved: <refs|none>; not attempted: <refs|none>` tail format: the tests parse it.

## Environment notes

The FIFO test needs `mkfifo` (present on Linux/WSL/CI ubuntu). It waits up to 10 s for ref 01 to reach resolved; runBoard's 15 s timeout kills a stuck child.
