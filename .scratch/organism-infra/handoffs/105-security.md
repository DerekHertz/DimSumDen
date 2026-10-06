# 105 security review

```json
{
  "ticket": "organism-infra/105-steering-spikes-conformance",
  "cell": "security",
  "current_step": "Security pass on 63e66db: no critical or high findings; two low notes. gitleaks clean.",
  "artifacts": [
    "apps/bridge/cells/conformance.mjs",
    "apps/bridge/cells/conformance.test.mjs"
  ],
  "decisions": [
    "Pass: spawn uses an args array with shell:false; no untrusted text reaches a shell, path or UI.",
    "Pass: child env is an allowlist (PATH, HOME, LANG, LC_*, DEN_CLAUDE_BIN); ANTHROPIC_API_KEY and the canary are not passed; canary leak is checked (S1).",
    "Pass: forbidden permission flags are rejected in buildArgs (decision 3); children run in mkdtemp dirs, not the repo.",
    "Pass: no network listener; the only network use is the existing scripts/usage-claude.mjs (token goes only to api.anthropic.com, never printed).",
    "Pass: tests use a fake claude binary in a temp dir with a temp HOME; no real login or network.",
    "Pass: committed fixtures in .scratch/organism-infra/artifacts/105-conformance-2026-10-05 hold no tokens, keys or account identifiers (apiKeySource is none)."
  ],
  "failures": [],
  "pending": []
}
```

## Findings

- apps/bridge/cells/conformance.mjs:447-451, low: the S3 allow phase answers every control_request with allow, not just Write. The prompt is fixed and the child runs in a temp cwd with a probe role that has Bash, so only a model misstep would matter. Optional hardening: allow only tool_name Write, deny the rest.
- apps/bridge/cells/conformance.mjs:633, low: the default --out is a timestamped dir under the OS tmpdir with default permissions; raw child stdout (session ids, cwd) lands there. Optional: mkdir with mode 0o700.

Also noted, not a defect: S4 writes real transcripts under the owner's real ~/.claude/projects because HOME is passed through (needed for login).

## Checks run

- gitleaks detect --log-opts="origin/main..63e66db": 1 commit, no leaks.
- Diff origin/main...63e66db: two files only (conformance.mjs, conformance.test.mjs). No dependency or lockfile change, so no audit gate. No workflow changes.
- npm audit: 0 vulnerabilities (cell-start npm ci output).
- Pattern grep of the spike artifacts for sk-ant, oauth, Bearer, api key, email: no hits.
- /security-review was not run; reviewed by hand.
