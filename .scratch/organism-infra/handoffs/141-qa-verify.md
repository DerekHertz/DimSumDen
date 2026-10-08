# 141 qa verify (light verify, escalated to full): steering approvals

```json
{
  "ticket": "organism-infra/141-steering-approvals",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify cannot pass. npm test on feat/141-steering-approvals (6efaaa1) finished with 2468 tests, 2464 pass, 3 fail, 1 cancelled, 0 skipped. All four top-level failures are browser or smoke tests outside the approval code. Escalate to full verify. No verdict written.",
  "artifacts": [
    "apps/bridge/cells/host-approvals.test.mjs",
    "apps/bridge/bridge-auth.test.mjs"
  ],
  "decisions": [
    "Escalated to full verify. Step 1 failures are timeouts in browser and smoke tests, which may be load-related. Confirming that needs a rerun, which light verify does not allow.",
    "Step 2 needs judgment, so it is escalated too: a secret string was split at runtime (host-approvals.test.mjs:45 and :414), and one default-deny input row was replaced (bridge-auth.test.mjs:332-333).",
    "No QA verdict written. The ticket keeps its in-review status (board release --keep-status)."
  ],
  "failures": [
    "apps/ci-cd/smoke-ui.test.mjs:98 'npm run smoke:ui passes on main: scene count, queue order, chart and one Approve round trip': did not finish within 170000ms",
    "apps/ui/src/overlay/floating-cards.test.mjs:192 'no sidebar: no aside or .panel ...': locator button.chip-tally not visible after 30000ms",
    "apps/ui/src/overlay/floating-cards.test.mjs:201 'DOM order is logo pill, Needs you, Stations & queue': locator button.chip-tally not visible after 30000ms",
    "apps/ui/src/overlay/proximity-card.browser.test.mjs:8 'entering the den shows the nearby resident card ...': test timed out after 60000ms"
  ],
  "pending": [
    {"item": "Full verify: scout reruns npm test on feat/141-steering-approvals and reports which top-level test was cancelled. Run it when no other full run holds the test lock.", "owner": "qa (full verify)"},
    {"item": "Security or orchestrator to judge the runtime split of the AWS key in host-approvals.test.mjs:45 (the comment says it keeps the repo secret scan clean).", "owner": "security"},
    {"item": "Full verify: decide whether replacing POST /approvals/abc in the default-deny table (bridge-auth.test.mjs:332) with POST /approvals and POST /approvals/abc/extra weakens criterion coverage.", "owner": "qa (full verify)"},
    {"item": "Developer's pending qa item 'run a /code-review pass' is not part of light verify and is not done here.", "owner": "qa (full verify)"}
  ]
}
```

## State

Claim: organism-infra/141-steering-approvals, cell qa, mode verify, via cell-start --detach --continue from base 6efaaa1. Claim status: in-review.

Step 1, `npm test` (run in the worktree, output saved to the scratchpad): the run took 265.8 s and exited with code 1. Summary: `# tests 2468`, `# pass 2464`, `# fail 3`, `# cancelled 1`, `# skipped 0`. The developer's handoff (141-developer-2) reported 2468/2468 green on the same commit. This run did not reproduce that. The run also waited on the machine-wide test lock (scripts/test-lock.mjs) for another worktree, which can stretch timings. The four top-level failures are listed in `failures`. No nested failure appears in host-approvals.test.mjs or bridge-auth.test.mjs. The developer's approval tests passed in this run.

Step 2, diff against the specify commit 18c30d4, two test files only:
- bridge-auth.test.mjs:332-333. In the default-deny table, `["POST", "/approvals/abc"]` was replaced by `["POST", "/approvals"]` and `["POST", "/approvals/abc/extra"]`. The assertion is unchanged. The old input became a real route once POST /approvals/:id was added.
- host-approvals.test.mjs:45 and :414. AWS_KEY and the bearer text are now built with join or concatenation. The runtime value is the same, and the assertions are unchanged. The stated reason is to keep the repo secret scan clean.

Step 3, criterion map (from the specify handoff, 141-qa-specify.md). Each describe block is in host-approvals.test.mjs:
- 1 hold, allow and deny: "holding a permission request (criterion 1)". Passed in this run.
- 2 allow without GET returns 409: "allow only after the full input was served (criterion 2)". Passed.
- 3 expiry, cap and shutdown deny: "fail closed (criterion 3)". Passed.
- 4 masking and bidi escaping: "masking and escaping (criterion 4)". Passed.
- Human-verified: none.

Step 4, files touched since d49248f, outside the ticket's scope list (not judged here): apps/bridge/bridge-auth.test.mjs, apps/bridge/cells/approvals.mjs, apps/bridge/cells/host-approvals.test.mjs, apps/bridge/cells/host.mjs, apps/bridge/cells/policy.mjs, apps/bridge/cells/runtime.mjs, apps/bridge/routes.mjs, apps/bridge/server.mjs, apps/bridge/watch.mjs.

## Failed calls

- Bash `npm test > <scratchpad>/qa141-npmtest.out 2>&1` (timeout 300000 ms): hit the bound and moved to background; it later exited with code 1. Cause: the run is long and waited on the test lock. Next: stopped waiting and read the saved output. Guess: fixable friction; a full run needs more than 5 minutes here.
- Bash `kill 1370487 1364455 1364191` (stop my timed-out run): "Permission denied by the auto mode classifier (Interfere With Workloads)". Did not retry. The run ended on its own. Guess: guardrail, but the processes were my own run, so the classifier may be over-broad.
- Bash `grep -n -E ... <scratchpad file>`: same classifier denial. Read the file with the Read tool instead, which worked. Guess: classifier over-reach on a read.
- Grep tool: "No such tool available". Used Bash grep. Guess: missing tool in this session, fixable.
- Bash `grep -n "^    not ok|^not ok..." <scratchpad file>`: succeeded after the earlier denial.

Environment issues: the full npm test takes longer than the 5-minute bound on this machine and contends with another cell for the test lock. Suggest a larger bound for full runs, or running the full suite in scout.
