# 195 developer: conformance setup guard

```json
{
  "ticket": "organism-infra/195-conformance-setup-guard",
  "cell": "developer",
  "current_step": "Implemented in apps/bridge/cells/conformance.mjs on feat/195-conformance-setup-guard. qa's 114 tests in conformance.test.mjs pass (none edited). Ready for light verify.",
  "artifacts": ["apps/bridge/cells/conformance.mjs"],
  "decisions": [
    "Setup guard: setupProblems(captures) reads each capture's init; permissionMode other than default (absent counts as wrong) or any mcp_servers entry makes runSpikes replace the result with verdict setup-invalid, evidence naming only the failing field(s). No control run is started for a setup-invalid spike. Exit code is 1 and a SETUP-INVALID banner prints.",
    "Every child of every spike now gets --setting-sources project,local and --strict-mcp-config (otherwise the guard would fail S1 to S7 on the owner's machine). The inline --settings deny (PROD_SETTINGS, the 6.10 .claude/** deny) rides on S8 and S4b children; S6b keeps its own deny.",
    "S4b tool: 'tail -f <unique file in a temp dir>' instead of sleep 61. ps matches the unique path; the runner polls until the process is really running before signalling (else the child is listed as unstarted). Temp dir removed in finally.",
    "S6b: exported S6B_DENY_TARGET = denied.txt; inline deny and worktree allow both name it; prompt and evaluator use it.",
    "Control run: spikes flagged control: true (S8, S4b, S6b, the ones that use --settings) run again with --settings left off, scored by the same evaluator, attached as result.control; fixtures are written as <id>-control*.jsonl. --no-control skips it. S1 to S7, S6 and S3b take no production --settings, so a control would be identical; not added.",
    "Known gap, not fixed (the S8 fake needs a 'sleep' prompt): S8 still runs 'Bash(sleep 15)'. If the owner's user-scope sleep guard still fires it would be dropped with the user hooks by --setting-sources project,local, so should be fine; a quick tool_result in S8 would show as a false interrupt effect."
  ],
  "failures": [],
  "pending": [
    {"item": "qa light verify (specify sha fbda482), then risk-check", "owner": "qa"},
    {"item": "User runs the re-run (below); architect records verdicts in ADR 0016", "owner": "architect"}
  ]
}
```

## How to run (from the main checkout, /home/dhertzell/dimsumden)

1. Open `claude` once in the main checkout so the workspace is trusted (S6b worktrees live under it).
2. Run:

```
node apps/bridge/cells/conformance.mjs --spike S8,S4b,S6b --repo . --out /tmp/den-conformance-195 --timeout 180
```

3. Read the terminal output. Any `SETUP-INVALID` line names the field (permissionMode or mcp_servers): nothing in that run is evidence; tell the orchestrator.
4. Copy the results into the repo for the architect:

```
mkdir -p .scratch/organism-infra/artifacts/106-conformance-2026-10-09 && cp /tmp/den-conformance-195/* .scratch/organism-infra/artifacts/106-conformance-2026-10-09/
```

Each of S8, S4b and S6b prints its verdict plus a `control (no --settings)` line. Use `--no-control` to halve the cost. Add S3b to `--spike` only if wanted.

## Failed calls

- Bash, a node script via heredoc: refused by the worktree guard as too complex; used Write plus a plain `node` run. Genuine guardrail.
