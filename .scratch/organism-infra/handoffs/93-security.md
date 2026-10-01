# Handoff: organism-infra/93-batch-groups-script (security)

Verdict: Security pass. Branch feat/batch-groups93 at ce0845a. Diff vs origin/main is two files: scripts/batch-groups.mjs and scripts/batch-groups.test.mjs.

```json
{
  "ticket": "organism-infra/93-batch-groups-script",
  "cell": "security",
  "current_step": "Security review complete: pass, no critical or high findings; two low notes.",
  "artifacts": ["scripts/batch-groups.mjs", "scripts/batch-groups.test.mjs"],
  "decisions": [
    "Pass: shell-outs use execFile with argv arrays and no shell (batch-groups.mjs:160,163)",
    "Pass: gitleaks origin/main..ce0845a found no leaks (2 commits)"
  ],
  "failures": [],
  "pending": [
    {
      "item": "orchestrator may open the PR and merge on green CI",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings

- Command injection: none. `gh pr list` and `git diff --name-only` go through `execFile` (no shell) with argv arrays. The branch name from `gh` is only interpolated into one argv element, `origin/main...origin/${branch}` (batch-groups.mjs:163). The `origin/` prefix means a branch name cannot be parsed as a git option. Ticket text never reaches a process call.
- Path handling: none. Board paths are built from `readdirSync` entry names under `$ORGANISM_ROOT/.scratch` (batch-groups.mjs:139-153); no ticket text or gh output is used in a file path. Reads only (`readFileSync`, `existsSync`, `readdirSync`).
- Writes: none. The script and its test have no write, rename, delete or mkdir calls. The only spawn in the test is `spawnSync(node, [SCRIPT, "--bogus"])` with an argv array (test:320).
- Network: none beyond `gh`. No daemon, no listener.
- ReDoS: regexes use constant field names and linear patterns; no concern.
- Low, batch-groups.mjs:129-134: ticket-derived paths and refs are printed to the terminal unescaped, so control characters in ticket text could reach the output. The input is the local board and the output is advisory; no action needed.
- Low, batch-groups.mjs:143-150: a symlinked directory under `.scratch` would be followed on read. This is the user's local board and the access is read-only; no action needed.
- Risk-check hit (shelling out, "board"/"lock") is a false positive as described: the script reads `.lock` presence only.
- No dependency changes, no workflow changes.

## Environment issues

None.
