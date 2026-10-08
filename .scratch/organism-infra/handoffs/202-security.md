# 202 security review (c60e449)

Security pass. No critical or high findings.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "security",
  "current_step": "Reviewed origin/main..c60e449 (conformance.mjs plus two test files). gitleaks clean (5 commits), no dependency, lockfile or CI change, npm audit 0 vulnerabilities. Verdict: Security pass.",
  "artifacts": [],
  "decisions": [
    "Pass with two medium/low comments, non-blocking"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Orchestrator: open PR and merge on green CI (relay autonomy). Optional follow-ups: the two comments below",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings (non-blocking)

- apps/bridge/cells/conformance.mjs:1113-1152 (compareS6bAllow), medium-low: the comparison probe temporarily edits the main checkout's `.claude/settings.local.json` and runs a live child there with a Write allow. The finally restores bytes and removes created files, and the restore tests are real. But a hard kill of the node process (SIGKILL, power loss) mid-probe leaves the temporary allow in place, and a concurrent interactive session in the same checkout would see it. Restore also uses writeFileSync, which keeps the existing mode but would give a recreated file default mode. Accepted: the user runs this deliberately and the HELP text says so. A note in the run instructions to check `git status` after an aborted run would help.
- apps/bridge/cells/conformance.mjs:969 (HOLD_ALLOW `Bash(tail -f *)`), low: wildcard allow lets the throwaway child tail any file. The prompt is fixed, the model is the cheap default, and the cwd is a temp dir, so exposure is negligible.
- apps/bridge/cells/conformance.mjs:1192, low: saved control stderr is scrubbed only for home paths and username (scrubText). Token-shaped strings in stderr would not be removed. Fixtures are copied into `.scratch/`, so skim S6b-control.stderr.txt before committing.

## Checked, no issue

- Process kill by marker (toolPids/killPid): marker is a random 12-hex name, the child pid and this process are excluded; no untrusted text reaches a shell (execFile with arg arrays; ps output only compared).
- Socket checks: dirUid/ownUid compare, group and other bits on dir and socket, foreign-owned dir turns go into no-go. Correct direction (fails closed).
- setupProblems: absent init, non-builtin plugins and hook_started now fail closed to setup-invalid; S6b exemption is documented and tested.
- Paths: absRule built from realpathSync of a worktree this script created; ctx.repo is user CLI input, same trust as before.
- No network exposure added; the S8 probe only connects to the child's own unix socket.
