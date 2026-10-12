# Handoff: queue/04-queue-admin-user-entry-point (developer, fix round)

```json
{
  "ticket": "queue/04-queue-admin-user-entry-point",
  "cell": "developer",
  "current_step": "Fixed the one qa verify finding: assertUntouched's .scratch listing check is exact again. Full npm test green (4382 pass, 0 fail). Committed on tests/queue-04-queue-admin-user-entry-point. Next: qa verify (light) again.",
  "artifacts": ["scripts/queue-admin.test.mjs", "branch tests/queue-04-queue-admin-user-entry-point"],
  "decisions": [
    "Replaced the { allow } option with a { scratch } snapshot: snapshotScratch(root) lists .scratch after putTicket and before the script runs; assertUntouched asserts the listing after equals that snapshot exactly, so any stray entry (including a stray den-v1 directory beyond the fixture) fails",
    "Callers without a fixture ticket keep the old default (usage.jsonl only if it existed before)",
    "Test-only change; no production code touched this round"
  ],
  "failures": [],
  "pending": [
    { "item": "qa verify (light) again, then npm run risk-check and security (permission boundary), per the earlier developer handoff", "owner": "qa" },
    { "item": "Apply the deny patch in 04-developer.md (ticket 07) and test '!npm run queue-admin' in the main session", "owner": "orchestrator" }
  ]
}
```

## What changed

- `scripts/queue-admin.test.mjs`: new `snapshotScratch(root)`; `assertUntouched(..., { scratch })` compares the `.scratch` listing to the snapshot. The four admit tests that create a fixture ticket (five-answer loop, /dev/null, missing reason or ref, bad refs) take the snapshot after `putTicket` and pass it. The `allow` option is gone.
- Suite: `npm test` 4382 tests, 4382 pass, 0 fail, 0 skipped (run after this change, so it also confirms the `scripts/queue.test.mjs` fixture edits from the earlier hop).

## Correction to 04-developer.md item 3

The earlier handoff said the /dev/null admit test "asserts no usage.jsonl and that the prompt names the ref, instead of calling assertUntouched". That was wrong. The test calls `assertUntouched(root, null, "devnull", r, "den-v1/05-thing", { scratch })`: usage.jsonl stays absent, the output names the ref, and the `.scratch` listing equals the pre-run snapshot. The `{ allow }` option mentioned in item 2 is now replaced by `{ scratch }`.
