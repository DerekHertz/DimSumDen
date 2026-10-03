# 119 qa specify handoff

Branch `tests/119-context-budget-gate`, specify sha 9984524ffaaff6b8a6f08f751466f46816fbb693, based on main 55d2071. Tests only; no product code.

```json
{
  "ticket": "organism-infra/119-context-budget-gate-for-cells",
  "cell": "qa",
  "mode": "specify",
  "current_step": "30 acceptance tests committed on tests/119-context-budget-gate in 3 files: 23 fail for the missing feature, 7 already pass (null-reading, without --self, no-context-key, below-70k guards). Full npm test: 1887 pass, 23 fail, 0 skipped; no existing test broke.",
  "artifacts": [
    "scripts/cell-start-context-gate.test.mjs",
    "scripts/context-self.test.mjs",
    "scripts/log-cell-context.test.mjs"
  ],
  "decisions": [
    "Orchestrator reading in cell-start is the existing context.mjs reading (no --self), driven in tests by HOME + CLAUDE_CODE_SESSION_ID and a top-level transcript fixture.",
    "Warning text must contain 'orchestrator context <n>k' and 'no new tickets'; refusal must be stderr containing exactly 'orchestrator context <n>k ≥ 80k: write the session handoff and ask the user to /compact'. <n> is tokens/1000 (tests use whole-k values).",
    "A refused cell-start must not claim the ticket or move the worktree: the gate runs before the claim and the switch.",
    "--self matches on the transcript record `cwd` equal to the process cwd, inside the current CLAUDE_CODE_SESSION_ID's subagents dir only; it ignores the status-line file (which holds the orchestrator's number for the shared session id). Output keys are exactly session, context_tokens, percent, scope.",
    "log-cell --context stores a number under row key `context`; value must be a non-negative integer (same rule as --tokens).",
    "The retro numbers go on the metrics CLI text output (scripts/metrics.mjs, no --json change so the existing deepEqual metrics test stays valid): 'Partial returns: <n>' (cell rows whose outcome starts with 'partial', case-insensitive) and 'Median final cell context: <int>' (median of numeric `context`, mean of the two middle values when even, rounded). Ticket says 'the retro prints'; if the user wants it elsewhere, tell qa."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement against the tests: cell-start gate (+ --force/--continue), context.mjs --self, log-cell --context, metrics lines. Write the gated patch to .scratch/_handoffs/gated/119-context-budget-gate.patch (organism-protocol stage-boundary checks, orchestrator genome handles partial); do not edit .claude/ directly. Record the shared-session-id check from a real subagent in a ticket comment.",
      "owner": "developer"
    }
  ]
}
```

## Criterion to test map

| Criterion | Test file: tests |
|---|---|
| AC1 warn at >= 70k | cell-start-context-gate: "warns at 70k", "warns at 79k"; "below 70k" is silent |
| AC1 refuse at >= 80k, exit 1, names /compact | cell-start-context-gate: "refuses at 80k", "refuses at 120k", "a refusal claims nothing" |
| AC1 --force | cell-start-context-gate: "--force proceeds at 85k" |
| AC1 --continue (warning, not refusal) | cell-start-context-gate: "--continue at 85k", "--continue at 75k", "--continue below 70k is silent" |
| AC1 null reading never blocks | cell-start-context-gate: three "null reading" tests (no transcript, no usage, no session id); these already pass and must keep passing |
| AC2 --self reads matching cwd | context-self: "reads the subagent transcript whose cwd matches" |
| AC2 ignores other concurrent cells | context-self: "ignores a newer transcript from another worktree", "ignores transcripts of other sessions", "never reports the orchestrator's number" |
| AC2 null when none matches | context-self: "returns null when no ... matches", "no subagents directory", "session id unset" |
| AC3 output without --self unchanged | context-self: "without --self, output is unchanged" plus the existing scripts/context.test.mjs |
| AC4 gated patch | human-verified (a patch to .claude/ cannot be tested before it is applied; verify reads the patch for: 70k finish stage, 80k commit WIP + handoff + release + `outcome: partial`, `--self` at stage boundaries, orchestrator re-dispatches a fresh same-type cell on the same branch with the handoff, same round not a bounce) |
| AC5 log-cell --context on the row | log-cell-context: "stores the reading as a number", "omits the context key", four rejection tests |
| AC5 retro partial count and median | log-cell-context: three metrics tests |
| AC6 npm test green | human-verified (verify runs it) |

## Notes for verify and developer

- The four log-cell rejection tests also assert the error is not "unrecognized argument", so they cannot pass vacuously.
- The ticket's shared-session-id confirmation in a real subagent is not testable here; it is a developer comment item.
- Gated: the organism-protocol and orchestrator genome edits go via patch only; I did not touch `.claude/`.
- The tests spawn `node scripts/cell-start.mjs` in a temp git repo with an npm stub, as cell-start-ticket-claim.test.mjs does.
