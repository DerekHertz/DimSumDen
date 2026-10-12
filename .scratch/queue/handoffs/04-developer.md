# Handoff: queue/04-queue-admin-user-entry-point (developer)

```json
{
  "ticket": "queue/04-queue-admin-user-entry-point",
  "cell": "developer",
  "current_step": "Implemented scripts/queue-admin.mjs, the queue-admin npm script, and the Queue reader changes (queue-admit rows, by:user enforcement). All 31 qa tests plus 6 new developer tests and edits to 4 existing ones pass. Committed on tests/queue-04-queue-admin-user-entry-point. Next: qa verify (light), then npm run risk-check and the full security review.",
  "artifacts": [
    "branch tests/queue-04-queue-admin-user-entry-point",
    "scripts/queue-admin.mjs",
    "scripts/queue-admin.test.mjs",
    "apps/organism-infra/frontier-queue.mjs",
    "package.json"
  ],
  "decisions": [
    "admit refuses a ref that is not a plain file <root>/.scratch/<feature>/issues/<NN-slug>.md (user ruling 1); the ref must be the full feature/NN-slug, exact",
    "loadSnapshot ignores any queue_active or queue-admit row without by exactly 'user' (ruling 2); the snapshot gains admitted: [ref], and gateRefusals skips those refs",
    "Root: --root, else $ORGANISM_ROOT, else the main checkout via board-service resolveRoot (ruling 3); outside a checkout with neither, it refuses",
    "Unknown flags (--yes, -y, --force, --confirm) are refused as unknown arguments, exit 2; usage errors exit 2, declined or refused exit 1",
    "Rows are appended through appendUsageLine (O_NOFOLLOW); if usage.jsonl lacks a final newline, a newline is prepended so the row never glues to the last line",
    "The settings deny patch is below in this handoff and NOT in .scratch/_handoffs/gated/, so apply-gated cannot apply it before ticket 07"
  ],
  "failures": [],
  "pending": [
    { "item": "qa verify: check the developer test changes listed below, then risk-check, then security (permission boundary, full review)", "owner": "qa" },
    { "item": "Apply the deny patch below (ticket 07), then test in the main session that '!npm run queue-admin -- active <feature>' still runs under the deny rules", "owner": "orchestrator" }
  ]
}
```

## What changed

- `scripts/queue-admin.mjs` (new): `active <feature>` and `admit <ref> --reason "<why>"`. Prompts (old and new value for `active`), reads one stdin line, writes only on exact `y`. `--root` accepted before or after the subcommand.
- `package.json`: `"queue-admin": "node scripts/queue-admin.mjs"`.
- `apps/organism-infra/frontier-queue.mjs`: `loadSnapshot` only honors `by:"user"` rows, reads `queue-admit` rows into `snapshot.admitted`; `gateRefusals` skips admitted refs. Existing frontier-queue and admission-gate tests pass unchanged (their rows already carry `by:"user"`).

## Test changes (for qa verify)

qa's 31 tests are kept as written except where ruling 1 or 3 made them need a change. Each change:

1. `admin()` helper: takes an `env` option and always strips `ORGANISM_ROOT` from the inherited environment (so a cell's own env cannot leak into ruling-3 tests).
2. `assertUntouched`: takes `{ allow }` extra directory names, since admit tests now create a `den-v1` ticket under `.scratch`.
3. Admit tests that wrote a row or expected the prompt (writes row; quotes/backslash/unicode; five non-y answers; /dev/null; missing reason or ref) now create ticket `den-v1/05-thing` first via `putTicket` (ruling 1 needs a real ticket). The /dev/null admit test now asserts no usage.jsonl and that the prompt names the ref, instead of calling assertUntouched with null (same assertion, plus the allowed `den-v1` dir).
4. New: "admit refuses a ref that names no ticket, or is not shaped like a ref" (10 refs, ruling 1).
5. New: "with no --root, run from a worktree, the row is written in the main checkout" (ruling 3).
6. New: "$ORGANISM_ROOT is the main checkout, and --root still wins over it" (ruling 3).
7. New: "with no --root, outside any checkout and no $ORGANISM_ROOT, it refuses" (ruling 3).
8. New: "loadSnapshot ignores a queue-admit row without by:user" and "ignores a queue_active row without by:user, and a later user row still wins" (ruling 2).

9. `scripts/queue.test.mjs` (queue/02 tests, not qa's queue/04 file): three fixtures wrote a queue_active row without by:user (lines 106, 121, 190), which ruling 2 now ignores; I added by:"user" to those rows. Without that, 2 tests fail in the full suite. Full npm test before this fix: 4380 of 4382 pass, the two failures being these; after, both files pass (57/57 with queue-admin.test.mjs). I did not re-run the whole suite after the fix.

Red check: against the old reader, the gate test, the reader-seam test and the queue_active by:user test fail; the queue-admit by:user test passes there because the old reader ignores queue-admit rows altogether. The new script tests were written before the script existed, but I did not run them red separately (the whole file fails without the script, as qa recorded).

## Settings deny patch (NOT applied; ticket 07 applies it)

Checked with `git apply --check` against `.claude/settings.json` at this base. Rules are the two from the architect's handoff.

```diff
diff --git a/.claude/settings.json b/.claude/settings.json
--- a/.claude/settings.json
+++ b/.claude/settings.json
@@ -45,7 +45,9 @@
       "mcp__plugin_engineering_github",
       "mcp__plugin_engineering_pagerduty",
       "Bash(git worktree remove --force:*)",
-      "Bash(git worktree remove -f:*)"
+      "Bash(git worktree remove -f:*)",
+      "Bash(npm run queue-admin:*)",
+      "Bash(node scripts/queue-admin.mjs:*)"
     ]
   },
   "statusLine": {
```

## Does the user's `!npm run queue-admin ...` run under the deny rules? NOT TESTED

I could not test it. I ran as a worktree subagent, not in the main session, and the deny rules are not applied (ticket 07), so there was nothing to test against. The architect's reading (a `!` command is not an agent tool call, so a Bash deny rule does not apply) is still unproven. The test belongs to ticket 07 right after the patch is applied: in the main session, run `!npm run queue-admin -- active <feature>` and answer `n`, and see whether it runs or is refused by permissions. Also note an agent's `npm run queue-admin` Bash call would be refused by the deny rule even before the stdin prompt matters.

## Out of scope, noted

- `docs/agents/` does not mention `queue-admin`; ticket 07 or the orchestrator genome patch may want a line there.
- `risk-check` should classify this ticket (permission boundary); the ticket already asks for full security.
