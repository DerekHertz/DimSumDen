# 195 security handoff

Verdict: Security pass (branch diff 2bc0000 vs origin/main; 2 files: conformance.mjs, conformance.test.mjs).

```json
{
  "ticket": "organism-infra/195-conformance-setup-guard",
  "cell": "security",
  "current_step": "Reviewed the branch by hand (the diff is two files, no dependency, CI or lockfile change). gitleaks over origin/main..2bc0000: 2 commits, no leaks. Verdict pass, no critical or high findings.",
  "artifacts": [],
  "decisions": [
    "Pass: the S4b in-flight tool is `tail -f <random tmp file>`; the path comes from mkdtemp plus randomBytes, so no untrusted text reaches the allowed-tool rule, the prompt or ps matching.",
    "Pass: S4b cleanup kills only pids whose command line carries that unique path (and never process.pid), so no collateral kills.",
    "Pass: every spike child now gets --setting-sources project,local and --strict-mcp-config, which narrows what the child loads. FORBIDDEN_FLAGS in buildArgs still blocks bypassPermissions.",
    "Pass: the control run only drops the inline --settings deny. S6b control writes denied.txt inside a throwaway worktree; S4b and S8 controls touch no files outside their temp dirs.",
    "Pass: the test stub shells out (`sh -c exec <command>`) but the command is parsed from the prompt the code under test sends, in a temp HOME, and the test SIGKILLs any surviving pid."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Low (non-blocking): setupProblems skips a capture with no init event, so a child that never starts reports no-go, not setup-invalid. Intended, noted only.",
      "owner": "orchestrator"
    },
    {
      "item": "Low (non-blocking): the guard checks permissionMode and mcp_servers only; user-scope plugins and hooks are not checked at init (S6b still checks plugins in its own evaluator).",
      "owner": "orchestrator"
    },
    {
      "item": "The user runs the spikes; an architect records verdicts in ADR 0016 (142-architect.md pending). The 6.3 verdicts need a security re-review after the re-run.",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings
- apps/bridge/cells/conformance.mjs:955 (S4b tool path), :1016 (cleanup kill): low, safe as is; unique random marker.
- apps/bridge/cells/conformance.mjs:728-738 (setupProblems): low, absent init skipped (above).
- No findings of medium or higher. No dependency, workflow or secret changes.
