# queue/07 developer handoff

```json
{
  "ticket": "queue/07-genome-and-settings-patch",
  "cell": "developer",
  "current_step": "Gated patch written and checked with git apply --check against the worktree (base 4411951, same as main HEAD). No repo files changed on the branch, so there is no code commit. Waiting on qa verify, then the user applying the patch.",
  "artifacts": [
    ".scratch/_handoffs/gated/07-queue-genome.patch"
  ],
  "decisions": [
    "Built the patch on a scratch git repo (copies of the two files), so no .claude/ file in the worktree was touched. Plain diff, so apply-gated uses its generic commit message.",
    "Step 5 and the opening sentence of step 6 are the architect's text from 01-architect.md verbatim; the rest of step 6 (route advisory, advisory-outcome) is unchanged, as the architect specified.",
    "Rules paragraph: dropped `order` and `jev-order` only. `jev.mjs order` is already retired on main (queue/06), so no dangling reference remains.",
    "Settings: added the two deny rules the architect named, `Bash(npm run queue-admin:*)` and `Bash(node scripts/queue-admin.mjs:*)`, after the worktree-remove rules. Per the 2026-10-12 user ruling, the wider deny variants, the .scratch/usage.jsonl Edit/Write deny and the qa genome lines are out of scope (queue/09)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa full verify: check criteria 1-3 (git apply --check on main; diff touches only steps 5 and 6, the Rules paragraph and the two deny rules; board gate, queue, pick and npm run queue-admin all exist)",
      "owner": "qa"
    },
    {
      "item": "User runs `!npm run apply-gated` and answers y to 07-queue-genome.patch; then confirms `board queue` runs in an orchestrator session (criterion 4)",
      "owner": "user"
    }
  ]
}
```

## Criteria status

1. Applies cleanly: `git apply --check` passes in the worktree. Re-run it in the main checkout just before the user applies, since main may have moved. Not run against main directly (the isolation guard blocks `git -C` into it).
2. Scope: the diff has 4 hunks only: genome step 5, step 6 opening, the one Rules-paragraph sentence, and the settings deny array. Nothing else.
3. Commands named by the new text exist on main: `board gate` (board.mjs, `--apply` flag), `board queue`, `board pick <ref> [--deviation]`, and `npm run queue-admin` (package.json to scripts/queue-admin.mjs).
4. Not yet: needs the user's apply.

Not proven: queue/04 criterion 5 (does the user's `!npm run queue-admin` still run with the deny rules in place). The user tests that after applying.
