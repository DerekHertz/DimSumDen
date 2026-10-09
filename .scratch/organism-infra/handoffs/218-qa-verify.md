# 218 qa verify handoff (light verify)

```json
{
  "ticket": "organism-infra/218-log-cell-ticketless",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify mechanical steps pass. Verdict withheld: one judgment point escalated to full verify (log-cell.mjs:89 handoff-check skip for ticketless non-scout rows).",
  "artifacts": ["scripts/log-cell-ticketless.test.mjs", "scripts/log-cell.mjs"],
  "decisions": [
    "Suite result taken from /tmp/218-tests.txt per dispatch; npm test not re-run.",
    "Low-80 failure (jev-hardening.test.mjs:230) treated as the known env failure named in the ticket Comments (197, empty /tmp/.git, which still exists)."
  ],
  "failures": [
    {"item": "Low-80: runJg is refused when checkout param is omitted and root has no .git ancestor (scripts/jev-hardening.test.mjs:230)", "why": "known environment failure per ticket Comments; /tmp/.git still present"}
  ],
  "pending": [
    {"item": "Full verify to rule on whether ticketless non-scout rows may skip the handoff check (scripts/log-cell.mjs:89); ticket says keep every other check", "owner": "qa"}
  ]
}
```

Branch: `tests/218-log-cell-ticketless`, HEAD 9cd4721 (developer commit "log-cell: accept --ticket none", on top of specify commit 66f9e74, base 2894737). Worktree: `/home/dhertzell/dimsumden/.claude/worktrees/agent-a8947089d1934f1f7` (detached at 9cd4721, clean).

Verify mode: light (dispatch line). Suite result taken from `/tmp/218-tests.txt` per the dispatch; `npm test` was not re-run.

## Light verify steps

1. Suite (from `/tmp/218-tests.txt`): 3185 tests, 3184 pass, 1 fail, 0 skipped. The one failure is `Low-80: runJg is refused when checkout param is omitted and root has no .git ancestor` (`scripts/jev-hardening.test.mjs:230`, "Missing expected rejection"). The ticket's Comments name this as the known environment failure (197, empty `/tmp/.git`). `/tmp/.git` still exists (empty dir, 22:49), so the cause still holds. Not a bounce under the ticket's exception, but AC4 ("npm test is green") holds only with that exception.
2. Test file diff since specify (`git diff 66f9e74 HEAD -- scripts/log-cell-ticketless.test.mjs`): empty. No assertion removed or loosened. Branch diff vs base touches only `scripts/log-cell-ticketless.test.mjs` (new) and `scripts/log-cell.mjs`.
3. Criterion to test map (all 8 tests `ok`):
   - AC1 `--ticket none` writes one row, `ticket: null`, same fields: tests 2070 (fields and values), 2071 (same key set as ticketed row), 2072 (bad --tokens still refused), 2073 (--transcript totals and spend row with no ticket), 2074 (unreadable --transcript still refused).
   - AC2 unknown ref other than `none` still refused: 2075 (`nosuch/99-ghost`, `None`, `NONE`, `null`, `-`, `none/01-x`, `none `), 2076 (omitted or empty --ticket).
   - AC3 `npm run spend` counts ticketless rows under role, not real tickets: 2077.
   - AC4 `npm test` green: met only with the Low-80 known-env exception above.
   - No criterion is human-verified.
4. Files outside ticket scope: none. `scripts/log-cell.mjs` and `scripts/log-cell-ticketless.test.mjs` are both in scope. `scripts/spend.mjs` is untouched.

## Escalate to full verify (one judgment point)

`scripts/log-cell.mjs:89`: `} else if (f.cell !== "scout" && !ticketless) {`. The handoff check is skipped for every ticketless row whose cell is not scout. The ticket says ticketless rows keep "every other field and check", and the specify handoff left the non-scout case to the developer. The developer's reading is defensible: a ticketless run has no `.scratch/<feature>/handoffs/` directory to check, so the check cannot run. It is still a loosening that no test pins and the ticket's wording does not cover. Light verify cannot decide it. The orchestrator or a full verify should rule on whether non-scout ticketless rows should skip the check or require `--allow-no-handoff`.

No `--verdict` is posted, because the escalation is open.

## Notes

- Specify decision carried forward: spend's `by_ticket["(none)"]` bucket is kept, since `spend-report.test.mjs` pins it. The ticket's "left out of per-ticket totals" is read as real tickets only.
- Developer's failing-run output is from worktree `agent-a910a156422f55bc5`. My worktree HEAD is the same developer commit.
