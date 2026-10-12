```json
{
  "ticket": "agent-os/02-grants",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify (dispatch: Verify mode light) of tests/agent-os-02-grants at 6ca76af: QA pass. Suite from the developer's saved output: 4014 pass, 0 fail, 0 skipped. The three checks the user asked for after bounce 1 all pass. Security is next for the risk-check hits.",
  "artifacts": [
    "apps/bridge/cells/grants.test.mjs",
    "apps/bridge/cells/grants-paths.test.mjs",
    "apps/bridge/cells/host-task-grants.test.mjs",
    "apps/bridge/cells/ceilings.test.mjs",
    "apps/bridge/cells/claude-runtime-wall.test.mjs",
    "apps/bridge/cells/governance.json"
  ],
  "decisions": [
    "Suite not re-run by qa, per the dispatch line. Used the developer's saved output 02-tests-4.txt: # tests 4014, # pass 4014, # fail 0, # cancelled 0, # skipped 0, # todo 0. The worktree HEAD is 6ca76af, the commit the developer ran.",
    "Step 2 (git diff 28a0244 HEAD over the specify test files): grants.test.mjs has additions only, the one new bare-ceiling test at line 127. host-task-grants.test.mjs, ceilings.test.mjs and claude-runtime-wall.test.mjs have no diff. No removed or loosened assertion. No .only, .skip or todo markers.",
    "grants-paths.test.mjs is not a specify file. The developer added it in round 2 (7be73f3), and round 3 added its .git tests. Read, not judged, for this step.",
    "Check 1, .git governed: governance.json guardrailPaths now has .git/**. Test: grants-paths.test.mjs, describe 'the main checkout's .git is never grantable'. A grant on <main>/.git, its config, hooks or a worktree admin dir compiles to Write and Edit deny rules and sandbox denyWrite, for developer, qa and security. The mechanism is a deny, not a 400: POST /tasks accepts the grant and the access is denied (forbid beats permit). That matches the user's 'add it to the governed deny list'. Orchestrator: confirm that 'refused' means denied and not a 400. Not a bounce.",
    "Check 2, probe: 02-developer-3.md records the live .git/config probe of the main checkout. Bare: shell writes Read-only file system, the Write tool asks, .git unchanged. With a path grant on <main>/.git: shell writes refused, the Write tool refused outright, .git unchanged, worktree write ok. Criterion stays human-verified (specify marked it a developer live item). Recorded, not re-run by qa.",
    "Check 3, bare ceiling: grants.test.mjs:127 'a ceiling with no grants has no sandbox.filesystem.allowWrite'. It covers scout, developer, qa and security with no grant, and developer, qa and security with a host-only grant. It fails if allowWrite is added to a bare ceiling. It passes on the unchanged code, as coverage, not a defect fix.",
    "Step 4, files changed on the branch since base 388906c, listed not judged: apps/bridge/cells/claude-adapter.mjs, claude-runtime.mjs, host.mjs; apps/bridge/server.mjs; apps/bridge/cells/governance.json (sibling data file, the specify notes allowed it, not named in the ticket); apps/bridge/cells/grants-paths.test.mjs (developer-added test file, not named in the ticket); apps/bridge/cells/grants.test.mjs and host-task-grants.test.mjs; apps/bridge/cells/ceilings.test.mjs and claude-runtime-wall.test.mjs (agent-os/04 tests, relaxed at specify); scripts/risk-check.mjs and scripts/risk-check.governance.test.mjs (not named in the ticket; specify noted GUARDRAIL_PATHS should grow).",
    "Not run by qa this round (outside light steps): gitleaks, risk-check. The developer's round 3 note: risk-check has hits, because governance.json is a guardrail file, so security is dispatched. Gitleaks: 2 known findings, not introduced by this branch (0c918a1e is an ancestor of base; 18c30d45 is in neither base nor HEAD)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Security review of the risk-check hits: claude-runtime.mjs shell-out, governance.json guardrail change (.git/** added), risk-check.mjs and risk-check.governance.test.mjs shell-out.",
      "owner": "security"
    }
  ]
}
```

# qa verify (light, round 2): agent-os/02-grants, branch tests/agent-os-02-grants at 6ca76af

Verdict: QA pass. Mode: light, per the dispatch line. The suite result is the developer's saved output, not re-run (per the dispatch). All three checks the orchestrator asked for after bounce 1 pass (see the decisions above). Bounce 1 findings are closed: finding 1 (the .git/config probe) by the developer's live run, finding 2 (bare-ceiling allowWrite) by grants.test.mjs:127, finding 3 (.git governed-path decision) by the user's decision and the governance.json change with tests.

## Criterion to test map

| Criterion | Test | Result |
|---|---|---|
| Adapter compiles each role's ceiling, and ceiling plus grant, into the settings | grants.test.mjs "task grants compile into the recorded settings"; bare ceilings in ceilings.test.mjs (04) and grants.test.mjs:127 | pass |
| Live: developer task writes and runs tests in its worktree with no request; a write outside is refused | human-verified (specify); developer live run, 02-developer-2.md (0 requests) | human-verified, not re-run by qa |
| A grant outside the fixed shape is a 400; no grant string in argv or prompt | host-task-grants.test.mjs (15 bad shapes); grants.test.mjs "outside the fixed shape" | pass |
| Forbid beats permit | grants.test.mjs "forbid beats permit" (3 roles x 11 grant sets x every deny) | pass |
| Governance denies, one test per entry | grants.test.mjs "the ceilings deny the governance paths and commands"; grants-paths.test.mjs "the main checkout's .git is never grantable" | pass |
| Bypass forms refused | grants.test.mjs "bypass forms" | pass |
| Deny rules hold with the wall on (git push, gh pr create) | FOUR assertion in each grant test; 04 live check | pass |
| Host names only (spike security finding) | grants.test.mjs "the wall's host list is names only" | pass |
| Read limit before any host | grants.test.mjs host-grant test (read limit rides with a host); live proof | pass + human-verified |
| Scope: a path grant containing the worktree is a 400 at POST /tasks | grants-paths.test.mjs "a path grant that contains the worktree" | pass |
| Scope: a path grant inside the main checkout meets the governance denies | grants-paths.test.mjs (round 2 and round 3 .git tests) | pass |
| Scope: .git/config probe of the main checkout | human-verified; 02-developer-3.md records the result | recorded |
| Scope: bare ceiling has no sandbox.filesystem.allowWrite | grants.test.mjs:127 | pass |
| `npm test` green | saved output: 4014 pass, 0 skipped | pass, not re-run |
| risk-check, gitleaks | not run by qa; risk-check hits expected, security dispatched | as expected |
