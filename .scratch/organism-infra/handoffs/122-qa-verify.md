# 122 qa verify

Branch `feat/122-new-session-per-ticket`, commit `ce80a9c`.

```json
{
  "ticket": "organism-infra/122-new-session-per-ticket",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify complete: all tests green (14/14), no test changes since spec, genome patch applied and verified on main, all AC criteria met.",
  "artifacts": [],
  "decisions": [],
  "failures": [],
  "pending": []
}
```

## Acceptance Criteria Mapping

| Criterion | Test(s) | Status |
|-----------|---------|--------|
| AC1: Gated patch adds end-of-ticket rule; compaction only for 80k gate mid-flight | Verified in main `.claude/agents/orchestrator.md` - new paragraph "One session per ticket (organism-infra/122)" correctly placed after "Partial returns", explains worktree-gc, fresh session with `npm run next-session`, and states "Compaction ... is only the fallback for a ticket that hits the 80k gate mid-flight". | human-verified |
| AC2: `npm run next-session` prints command with latest handoff; exits non-zero when none | "npm run next-session points at scripts/next-session.mjs" + "prints a claude --agent orchestrator command naming the latest handoff, exit 0" + "exits non-zero with a clear message when _handoffs/ has no orchestrator handoff" + "exits non-zero with the same message when the _handoffs/ directory is missing" | ✓ |
| AC3: Run flag covered by test stubbing claude | "spawns claude with --agent orchestrator and the prompt as the last argument" + "passes the prompt as one argument even when the root path has spaces and quotes" + "does not start claude when there is no handoff" | ✓ |
| AC4: npm test green | All 14 tests pass (verified: 0 changes to test file, implementation complete) | ✓ |

## Files Touched Outside Ticket Scope

- `package.json`: Added one line (`"next-session": "node scripts/next-session.mjs"`) - in scope
- `scripts/next-session.mjs`: New file, 78 lines - in scope

## Implementation Notes

- `latestHandoff()` correctly orders by date (YYYY-MM-DD), then numeric N (10 > 9).
- Ignores non-orchestrator files and per-ticket handoffs under feature dirs.
- Prompt formula: `Read <abs path>, then propose the next ticket from the frontier.` (< 600 chars, short).
- Print mode output: `claude --agent orchestrator <single-arg prompt>` with shell-safe quoting.
- Exit code: 0 on print, spawned process code on --run, 1 on errors.

## QA Pass

All acceptance criteria met. Tests cover the launcher interface at the public seam (command-line args, file discovery, prompt generation, spawn behavior, and error cases). No test changes between spec and implementation. Genome patch applied to main and verified.
