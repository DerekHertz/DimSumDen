# 195 qa verify: conformance setup guard

```json
{
  "ticket": "organism-infra/195-conformance-setup-guard",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify of feat/195-conformance-setup-guard at 2bc0000 stopped at step 3: escalate to full verify. Everything else passed. No verdict written.",
  "artifacts": ["apps/bridge/cells/conformance.mjs", "apps/bridge/cells/conformance.test.mjs"],
  "decisions": [
    "Step 1, npm test: 2516 tests, 2516 pass, 0 fail, 0 skipped (saved output tool-results/b5bk8cshc.txt). 56 conformance-named tests ran.",
    "Step 2, diff vs specify sha fbda482: conformance.test.mjs is unchanged (empty diff). No assertion removed or loosened.",
    "Step 3, criterion map: see below. Criterion 1 ('every spike') has no test for S5. Escalating, not bouncing, because deciding whether that counts as covered is judgment.",
    "Step 4, files outside scope: none. git diff --stat f19e4b6 HEAD touches only apps/bridge/cells/conformance.mjs and conformance.test.mjs.",
    "npm run risk-check: exit 1, one hit: apps/bridge/cells/conformance.test.mjs 'shelling out to another program'. Per the relay this dispatches security."
  ],
  "failures": [],
  "pending": [
    {"item": "Full verify: decide whether S5 (no setup-guard test) leaves criterion 1 'every spike' uncovered. conformance.mjs:1195 runs setupProblems over all spikes' captures, S5 included, via runS5 at conformance.mjs:728-738; the specify note said S5 was not covered because it reads no child init, which is not accurate for this code.", "owner": "qa"},
    {"item": "Security review of the risk-check hit (conformance.test.mjs shell-out, from the specify test file)", "owner": "security"},
    {"item": "User runs the re-run from the developer handoff; architect records verdicts in ADR 0016", "owner": "architect"}
  ]
}
```

## Criterion to test map

- Bad permissionMode or mcp_servers makes every spike setup-invalid, naming the field: `setup guard, S1|S2|S3|S4|S6|S7|S8|S4b|S6b|S3b: ...` (passing, ok 122 to 141), `setup guard: both fields wrong are both named` (ok 142), `setup-invalid is written to results.json` (ok 143), `permissionMode default with no MCP servers is not setup-invalid` (ok 144). **No test for S5.**
- S4b in-flight tool is a real process, not sleep: `runSpikes S4b: the in-flight tool is a real process, running when EOF and SIGTERM land, and it is not a sleep command` (ok 96); `runSpikes S4b: the tool call is never reported as unstarted when the tool really ran` (ok 100).
- S6b deny target outside .claude/: `S6B_DENY_TARGET is a relative path inside the worktree and outside .claude/` (ok 116); `runSpikes S6b: the prompt names the new deny target and never the .claude/ one` (ok 118); `runSpikes S6b: no inline deny rule and no project-local allow rule points into .claude/` (ok 119).
- Control run without --settings, scored next to each spike: `runSpikes S6b: a control run ... does not change the spike's verdict` (ok 120); `runSpikes S8: a control run without --settings is produced` (ok 121); `runSpikes S4b: production-shaped arguments ...` (ok 101).
- Run instructions fit one screen and paste from the main checkout: human-verified (developer handoff, "How to run" section).

## Notes, not findings

- Developer's known gap: S8 still runs `Bash(sleep 15)`. The ticket's no-sleep rule is for S4b only, so this is not a criterion failure. Flagged for the full verifier.
- The specify test file is unchanged since fbda482, so the developer's change did not touch the tests.
- Light verify ran at the developer's head 2bc0000. No code was changed by qa.
