# queue/07 qa full verify: QA pass

```json
{
  "ticket": "queue/07-genome-and-settings-patch",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify done: criteria 1-3 pass, criterion 4 awaits the user's apply. Verdict QA pass.",
  "artifacts": [
    ".scratch/_handoffs/gated/07-queue-genome.patch"
  ],
  "decisions": [
    "Used the developer's saved suite run as the suite result (4403 tests, 0 fail, 0 skipped, 0 cancelled), per the dispatch prompt; did not re-run.",
    "No qa specify tests exist for this ticket (developer direct), so there is nothing to diff for weakened assertions. The branch has no code commit."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User runs `!npm run apply-gated`, answers y to 07-queue-genome.patch, then confirms `board queue` runs in an orchestrator session (criterion 4), and tests queue/04 criterion 5 (`!npm run queue-admin ...` still runs with the deny rules in place)",
      "owner": "user"
    }
  ]
}
```

## Criteria

1. Applies cleanly: `git apply --check` on the patch passes at cc5dd7a, which equals main HEAD. Re-run just before the user applies if main moves.
2. Scope: `git apply --stat` shows only `.claude/agents/orchestrator.md` (3 lines) and `.claude/settings.json` (2 lines). The patch has 4 hunks: loop step 5, loop step 6, the Rules paragraph sentence (drops `order` and `jev-order`; no other `order` mention remains in that paragraph), and two appended deny rules (`Bash(npm run queue-admin:*)`, `Bash(node scripts/queue-admin.mjs:*)`). The wider deny variants, the usage.jsonl deny and the qa genome lines are absent, as the 2026-10-12 ruling requires (queue/09).
3. Commands exist on main: `board queue` (board.mjs `case "queue"`), `board pick <ref> [--deviation]` (`case "pick"`), `board gate` with a dry run and `--apply` (`case "gate"`), and `npm run queue-admin` (package.json to scripts/queue-admin.mjs, file present).
4. Human-verified: needs the user's apply.

## Outside scope

None. The branch changes no files.
