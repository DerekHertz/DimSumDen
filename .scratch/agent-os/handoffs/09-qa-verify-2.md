```json
{
  "ticket": "agent-os/09-main-git-write-rule",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify done: QA pass. Suite 4286/4286, 0 skipped (developer's saved run /tmp/09-tests.txt, not re-run per dispatch). Specify tests unedited. Every criterion mapped. The untested host preflight refusal was probed by hand and works; it is a coverage note, not a bounce.",
  "artifacts": [
    "branch tests/agent-os-09-main-git-write-rule at e722a3b (developer), specify sha 6bcf5bc",
    "no qa files committed this round; throwaway probe test deleted, worktree clean"
  ],
  "decisions": [
    "QA pass. Rule 2 bounce conditions checked: no test failed or skipped; no specify test changed (git diff 6bcf5bc HEAD over the three specify files is empty); every criterion has a passing test or is human-verified/process; no mock-only tests.",
    "Host preflight refusal (host.mjs:313-321, 502) has no committed test. Not a bounce: qa specify itself listed it as untested, and ticket criterion 1 is met by prepareMainGit's refusal test (main-git-rule.test.mjs:130) plus the host preflight-before-spawn test (:196). I probed it with a throwaway test (missing .git/index): 502, runtime spawn never called, no worktree left, git worktree list shows 1, a second dispatch is 502 not 409 (reservation released). Probe deleted. Suggest a follow-up test in host-workspace.test.mjs.",
    "Publish for an agent that made no commit creates the branch at base HEAD (host.mjs watch, developer decision). Harmless: the branch is an ordinary ref at an existing commit, and git branch refuses to move an existing one. Untested; note only.",
    "Criterion 4 (live probe) human-verified: developer's table in 09-developer.md, 0 permission requests, main HEAD and refs unchanged, git commit in the worktree succeeded, git worktree add by the sandboxed agent fails read-only (expected, not a ref write), git gc --auto printed nothing. Qa did not re-run it.",
    "Criterion 6: suite green, gitleaks no leaks (developer), risk-check exit 1 with 3 'shelling out' hits (claude-runtime.mjs, workspace.mjs, main-git-rule.test.mjs). The hits are the expected trigger: full security review is the next step, not a qa gate.",
    "Review of the diff against the ADR rule: denies keyed on mainGit not root; refs/** , HEAD, packed-refs, index only (objects and worktrees untouched); applies to every role including scout; bad mainGit is a TypeError; publish accepts only a derived den/ name and never moves an existing branch; RC_FILES gained the four bash startup files."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Full security review of the branch (risk-check hit; criterion 6). Points: preflight packs refs in the main checkout (git pack-refs --all --no-prune) on first spawn; publish runs git in the agent-controlled worktree dir (rev-parse HEAD) after the agent ends; a missing index refuses every spawn in a repo with no index.",
      "owner": "security"
    },
    {
      "item": "Optional follow-up test: host-level preflight refusal (502, no spawn, worktree removed, reservation released) and publish-with-no-commit.",
      "owner": "developer"
    }
  ]
}
```

# qa verify (full): agent-os/09

Verdict: QA pass.

## Checks

1. Suite: `/tmp/09-tests.txt` shows 4286 tests, 4286 pass, 0 fail, 0 skipped, 0 todo. Not re-run, per the dispatch.
2. Specify tests: `git diff 6bcf5bc HEAD` over `main-git-rule.test.mjs`, `workspace.test.mjs`, `host-workspace.test.mjs` is empty. The two other changed tests (`conformance-live.test.mjs`, `host-task.test.mjs`) only add the `mainGit` key to an expected argv and key list.
3. Criteria: see the criterion map in 09-qa-verify.md; all covered or human-verified. Criterion 3 holds, criterion 5 has a test per entry per role.
4. Quality: tests go through compileCeiling, prepareMainGit, createWorkspaces and the HTTP host with real git. They check behavior, not mocks.

## The two open points

- Host preflight refusal: probed with a throwaway test (deleted). A repo with no `.git/index` gives 502, no spawn, no leftover worktree, reservation released. The code is right; only the committed test is missing.
- Criterion 6: process. risk-check's three hits are the intended trigger for a full security review.

## Failed calls

None.
