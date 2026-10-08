# 141 qa verify 3 (full verify)

Branch: feat/141-steering-approvals-2, checked out detached at f176d3c in worktree /home/dhertzell/dimsumden/.claude/worktrees/agent-a95f8cf3d6977bde8.

Verdict: QA pass (posted as board comment with --verdict pass).

```json
{
  "ticket": "organism-infra/141-steering-approvals",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify of developer round after security bounce: npm test green, criteria mapped, verdict pass. Status left in-review.",
  "artifacts": [
    "apps/bridge/cells/host-approvals.test.mjs",
    "apps/bridge/cells/approvals-mask.test.mjs",
    "apps/bridge/bridge-auth.test.mjs"
  ],
  "decisions": [
    "Full verify, not light: this session did not write the specify tests (specify commit f485b33).",
    "bridge-auth.test.mjs: the unknown-route case POST /approvals/abc was replaced by POST /approvals and POST /approvals/abc/extra, because /approvals/:id is now a real route. Treated as a necessary input update, not a weakened assertion. Same edit was accepted in qa-verify-2.",
    "host-approvals.test.mjs is byte-identical to its specify version (no diff from f485b33 to HEAD)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "security: gitleaks HIGH on the fake bearer fixture. host-approvals.test.mjs:414 is unchanged from specify and still builds the bearer string from split parts. Confirm whether the finding is still hit on this branch's commits, and decide history handling (user approves).",
      "owner": "security"
    }
  ]
}
```

## Test run (scout, read-only, on f176d3c)

- `npm test`: 2475 tests, 2475 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo. About 121 s. Bom check clean (1322 files).
- Worktree clean at the time of the run.
- Skip grep under apps/*.test.mjs: one hit, apps/organism-infra/board-resolve.test.mjs:351, a platform-conditional skip (`process.platform === "win32"`) from ticket 114. It did not skip on Linux and is outside ticket 141's scope. Not a bounce.

## Criterion to test map

1. Fake-runtime hold, answered allow and deny: host-approvals.test.mjs:118 (allow), :133 (deny), plus the hold tests at :90-:110.
2. Allow without prior GET returns 409: host-approvals.test.mjs:223 (also :234, :244, :146).
3. Expiry, per-agent cap, shutdown each deny: host-approvals.test.mjs:270 (expiry), :293 (cap), :336 (shutdown). Also stop at :313 and child exit at :325.
4. Secrets masked and bidi escaped in served input, tool.summary and notes: host-approvals.test.mjs:361, :372, :386, :408, :430. Unit level: approvals-mask.test.mjs:14-57.

Human-verified: none required by the ticket.

## Scope notes

- Files the 141 diff touches outside the ticket's stated scope: none checked beyond the test files. The f176d3c fix commit touches approvals.mjs and approvals-mask.test.mjs only.
- Pass is for the test and criterion check. Security findings from the earlier bounce are not re-judged here: the masking fix (approvals.mjs, span-only masking and zero-width escapes) is covered by approvals-mask.test.mjs.
