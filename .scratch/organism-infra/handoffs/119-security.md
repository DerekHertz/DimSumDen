# 119 security handoff

Security pass. Branch feat/119-context-budget-gate @ c1c33dd2f2e272811152e97d0ccbac75abf601ed. No critical or high findings.

```json
{
  "ticket": "organism-infra/119-context-budget-gate-for-cells",
  "cell": "security",
  "current_step": "Reviewed the full diff against origin/main by hand: gitleaks clean (3 commits), no dependency, lockfile or workflow changes. Security pass; three low findings, none blocking.",
  "artifacts": [
    "scripts/cell-start.mjs",
    "scripts/context.mjs",
    "scripts/log-cell.mjs",
    "scripts/metrics.mjs"
  ],
  "decisions": [
    "scripts/cell-start.mjs:62 spawnSync(process.execPath, [CONTEXT]) uses a fixed script path from import.meta.url, an argv array and no shell; no untrusted text reaches it. Output is parsed as JSON and only a finite number is used, so the printed warning and refusal can only contain an integer. No injection path.",
    "scripts/context.mjs --self is read-only: it reads transcripts under HOME and prints a number. No board file writes, no network, no daemon change. Transcript content never reaches the shell, a path or the UI.",
    "scripts/log-cell.mjs:37 --context is validated with the same ^[0-9]{1,15}$ rule as --tokens and stored with Number(); no new write path.",
    "scripts/metrics.mjs contextStats only reads usage rows and type-checks them; text output only.",
    "Tests write only under mkdtemp fixtures with HOME overridden; they do not touch the real HOME or board. Stub is a fixed 'exit 0' script in a temp dir.",
    "gitleaks detect --log-opts origin/main..c1c33dd: no leaks found."
  ],
  "failures": [],
  "pending": []
}
```

Findings (all non-blocking):

- scripts/context.mjs:107 (selfTranscript): low. `id` comes from the CLAUDE_CODE_SESSION_ID env var and is joined into a path without a format check (e.g. `../`). The env is harness-set and the read yields only a number, so impact is negligible; a UUID-shape check would harden it. The existing `sessionTranscript` has the same pattern.
- scripts/context.mjs:72 (transcriptCwd): low. It reads each subagent transcript fully with readFileSync across all project slugs; a very large transcript costs time and memory. Local only, bounded by the 15s spawn timeout when called from cell-start (the --self path is called directly by cells).
- scripts/cell-start.mjs:37 (--force/--continue): low. The budget gate is advisory: any caller can pass the flags to skip the refusal. This is by design (the docs say --force needs the user's yes) and it is not a security boundary.
