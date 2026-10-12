# Handoff: agent-os/11 qa verify (full)

```json
{
  "ticket": "agent-os/11-main-git-rule-followups",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA pass on tests/agent-os-11-main-git-rule-followups at 4fe958c. Full verify per the user's approval (ticket comment). Next: risk-check, gitleaks, full security review.",
  "artifacts": [
    "apps/bridge/cells/claude-runtime.mjs",
    "apps/bridge/cells/main-git-failclosed.test.mjs"
  ],
  "decisions": [
    "Suite result taken from the developer's saved output /tmp/11-tests.txt (not re-run, per dispatch): 4314 tests, 4314 pass, 0 fail, 0 skipped. I re-ran only the new file: 28/28 pass.",
    "git diff 4a8f331 HEAD touches only apps/bridge/cells/claude-runtime.mjs (+5/-1). The specify test file and the agent-os/02, 07, 09 tests are unchanged, so nothing was deleted or loosened.",
    "Criterion 1 is covered by 17 runtime-seam tests (4 roles x 4 odd paths + a plain-path guard) and 6 host-seam tests (real runtime, stub claude): the spawn throws a TypeError, the host's existing 502 spawn-failure branch refuses, and no worktree or reservation is left. The tests are outcome-based, so they would also accept 'spawned with all four denies'; they are not coupled to the throw.",
    "Criteria 2 and 3 are covered by describes 'the host's preflight refusal' (3) and 'publish for an agent that made no commit' (2). They were green at specify as characterization tests and stay green.",
    "Criterion 5 (risk-check, gitleaks, security review) is process-only: human-verified, run by the orchestrator and security."
  ],
  "failures": [
    "Developer's first full npm test run reported 1 failure of 4314 with the name not captured; two later full runs were 4314/4314. Likely a pre-existing flake, unidentified. Not blocking."
  ],
  "pending": [
    {
      "item": "Run npm run risk-check and gitleaks; dispatch full security review. Note for security: the new throw applies to every role (walled or not) whenever mainGit is given and not plain; the host always passes mainGit. root and home are still dropped silently when not plain, which only weakens the governance denies and was out of this ticket's scope.",
      "owner": "security"
    }
  ]
}
```

## Criterion map

1. Fail closed on an unusual path: main-git-failclosed.test.mjs, describes "the runtime never spawns a walled role without the main .git denies" (17) and "a repository whose path is not plain starts no walled agent ..." (6). Pass.
2. Host preflight refusal: describe "the host's preflight refusal (the main .git is not ready)" (3: 502, no spawn, no worktree/branch/agent, second dispatch 502 not 409, dispatch succeeds after repair). Pass.
3. No-commit publish: describe "publish for an agent that made no commit" (2: workspace and host seam). Pass.
4. agent-os/02, 07, 09 tests unchanged and green: diff touches one source file only; full suite green.
5. npm test green (from /tmp/11-tests.txt); risk-check, gitleaks, security: human-verified/process-only.

## Out-of-scope files in the diff

None. Only apps/bridge/cells/claude-runtime.mjs changed since specify.
