```json
{
  "ticket": "agent-os/09-main-git-write-rule",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify run and escalated to full verify, so no verdict. Suite green: 4286/4286, 0 skipped (saved output /tmp/09-tests.txt, not re-run, per dispatch). Specify tests unedited. Two items need judgment: criterion 6 (process only, no test) and the host-level preflight refusal (no test).",
  "artifacts": [
    "branch tests/agent-os-09-main-git-write-rule at e722a3b (developer), specify sha 6bcf5bc",
    "apps/bridge/cells/main-git-rule.test.mjs, workspace.test.mjs, host-workspace.test.mjs (specify tests, unedited)"
  ],
  "decisions": [
    "No verdict: light verify rule 3 needs judgment on criterion 6 and on the untested preflight refusal, so escalated to full verify.",
    "Criterion 4 marked human-verified in ## Comments (the specify marker was missing there; added this verify).",
    "Criterion 3 holds: conformance-live.test.mjs and host-task.test.mjs (developer, one line each) come from cb84720/353039c and c6572eb, not agent-os/02 or 07. Their assertions are updated for the mainGit key, not loosened.",
    "Step 4, files outside the ticket's named list (listed, not judged): apps/bridge/cells/claude-runtime.mjs, conformance-live.test.mjs, host-task.test.mjs. Inside the ticket's areas: claude-adapter.mjs, grant-policy.mjs, host.mjs, workspace.mjs."
  ],
  "failures": [
    "Full verify must decide: host-level preflight refusal (host.mjs, 502 'not ready') has no test. host-workspace.test.mjs:173-180 covers only runtime failSpawn. Ticket criterion 1 names 'or the spawn refused'; prepareMainGit refusal is tested in main-git-rule.test.mjs:130."
  ],
  "pending": [
    {
      "item": "Full verify: (a) judge criterion 6, where risk-check exits 1 with 3 hits (expected security dispatch) and the full security review is pending; (b) decide whether the untested host preflight refusal is a bounce (developer owns the test); (c) developer's open edge case: publish for an agent that made no commit (branch at base HEAD) is untested.",
      "owner": "qa"
    }
  ]
}
```

# qa verify (light, then escalated): agent-os/09

## Light verify steps

1. Suite: `/tmp/09-tests.txt` shows `# tests 4286`, `# pass 4286`, `# fail 0`, `# skipped 0`, `# todo 0`. Not re-run, per the dispatch's suite-result line.
2. `git diff 6bcf5bc HEAD` over the three specify test files: no changes. Changed test files outside the specify set: `conformance-live.test.mjs` (`deepEqual` argv gains `mainGit`) and `host-task.test.mjs` (exact key list gains `mainGit`). Both are updated, not weakened.
3. Criterion to test map:
   - 1, denies per role with and without grants, objects and worktrees writable, keyed on mainGit not root, bad mainGit TypeError: `main-git-rule.test.mjs:66` "compileCeiling with mainGit denies...". Pass.
   - 1, preflight makes targets exist or refuses: `main-git-rule.test.mjs:130` "prepareMainGit makes every deny target exist, or refuses". Pass. The host-level refusal (spawn refused) is NOT covered; see failures.
   - 1, host passes mainGit for every task and preflights before spawn: `main-git-rule.test.mjs:196`. Pass.
   - 1, detached worktree from `workspace.create` (exact argv, no branch, HEAD equals root HEAD): `workspace.test.mjs:80` "create adds a detached worktree...". Pass.
   - 2, bridge creates the branch at the final commit: `workspace.test.mjs:101` (publish at final commit, main HEAD unmoved), `:123` (refuses to move existing branch), `:135` (refuses non-derived name); `host-workspace.test.mjs:142` "the bridge creates the agent's branch at its final commit". Pass.
   - 2, rewritten detached assertions in host-workspace: covered by the same file's first test. Pass.
   - 3, agent-os/02 and 07 tests unchanged and green: no diff in those files; suite green. The two changed existing tests are not 02/07 (see decisions). Pass.
   - 4, live probe through `createClaudeRuntime`: human-verified (developer-run, table in `09-developer.md`). Qa did not re-run the probe.
   - 5, bash startup files refused with 400, one test per entry per role plus absolute home form: `main-git-rule.test.mjs:237` onward. Pass.
   - 6, `npm test`, risk-check, gitleaks, full security review: process, no test. Suite green; gitleaks no leaks; risk-check exit 1 with 3 hits, the expected security dispatch. Judgment needed (see failures).
4. Files outside the ticket's named list (listed, not judged): `apps/bridge/cells/claude-runtime.mjs`, `apps/bridge/cells/conformance-live.test.mjs`, `apps/bridge/cells/host-task.test.mjs`. Others changed: `claude-adapter.mjs`, `grant-policy.mjs`, `host.mjs`, `workspace.mjs`.

## Escalation

Light verify rule 3 needs judgment on two points, so there is no verdict: criterion 6 is process-only, and the host-level preflight refusal path has no test. Full verify should run the suite (scout) and decide both.

## Failed calls

- Read, the main checkout's `apps/bridge/cells/host-workspace.test.mjs`, read in error (the main checkout is not the branch). Re-read the worktree copy by absolute path. No effect on the verdict.
