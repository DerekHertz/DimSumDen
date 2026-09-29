# Handoff: organism-infra/32 security review

Verdict: Security pass (no critical or high findings). Branch organism-infra/32-usage-estimate at 5b6bcbb, diffed against origin/main (3-dot, 4 files, all under scripts/). No dependency, lockfile, workflow, or .claude change.

```json
{
  "ticket": "organism-infra/32-cloud-usage-estimate",
  "cell": "security",
  "current_step": "review complete; verdict Security pass, handoff published, ready to release",
  "artifacts": [
    "scripts/usage-estimate.mjs",
    "scripts/usage-estimate.test.mjs",
    "scripts/context.mjs",
    "scripts/usage.mjs"
  ],
  "decisions": [
    "Content and exfiltration: usage-estimate.mjs parses each transcript line and reads only rec.type, rec.timestamp, and message.usage.{input,cache_creation_input,cache_read_input,output}_tokens. It prints only numeric aggregates plus last_reading.ts. It imports no network, child_process, or write APIs (grep count 0). Output is stdout only.",
    "usage.mjs fallback runs only in the catch of the credentials read, before any token is used or fetch is made, and only when CLAUDE_CODE_REMOTE is set. It exits 0 after printing. No credentials are read or sent on that path.",
    "Symlinks: jsonlFiles uses Dirent.isFile(), which does not follow symlinks, so symlinked transcripts are skipped in the estimate.",
    "Path traversal, CLAUDE_CODE_SESSION_ID (context.mjs:50-66): probed with fixtures. An id of ../../../outside resolves to <home>/outside.jsonl and is read. A non-.jsonl target is not read, because .jsonl is appended. Reach is limited to *.jsonl files whose records look like assistant usage. Rated low, see finding 1.",
    "USAGE_LOG: read-only, JSON lines. Only ts (must be Date.parse-able) and numeric cloud_credits are kept. Probed with a foreign log: extra fields such as secret were not echoed, and /etc/passwd yields last_reading null. No leak. Benign.",
    "ORGANISM_ROOT: only used to build the default path <root>/.scratch/usage.jsonl for a read. Cannot redirect to anything except that fixed suffix. Benign.",
    "cwd slug: non-alphanumerics become '-', so no traversal via cwd.",
    "Flagged spawn (scripts/usage-estimate.test.mjs:22,75,123,149): benign. spawnSync('node', [literal repo script path]) with an argv array and no shell. Inputs are mkdtemp fixtures, and HOME is overridden to the fixture so the real ~/.claude and credentials are never read. 7 of 7 tests pass on my run.",
    "Secrets: gitleaks is not installed (not at ~/.local/bin, not on PATH), so I fell back to reading the full patch of both branch commits (git log -p origin/main..5b6bcbb). No keys, tokens, or credentials in the patch. This is a manual check, not a gitleaks run."
  ],
  "failures": [
    "gitleaks missing: ~/.local/bin/gitleaks does not exist and 'which gitleaks' exits 1. Fell back to a manual patch read.",
    "git log -S '' --pickaxe-regex crashed with 'BUG: diffcore-pickaxe.c:240' on my first secrets scan attempt. Used git log -p instead."
  ],
  "pending": [
    {"item": "Optional hardening, finding 1 (low): validate CLAUDE_CODE_SESSION_ID against /^[A-Za-z0-9_-]+$/ in scripts/context.mjs before path.join, and coerce usage fields with Number() in lastUsageTokens", "owner": "developer"},
    {"item": "Install gitleaks to ~/.local/bin so the secret scan can run per genome", "owner": "user"},
    {"item": "Propose merge of organism-infra/32-usage-estimate (5b6bcbb) after user approval", "owner": "orchestrator"}
  ]
}
```

## Findings

1. scripts/context.mjs:56 (sessionTranscript), low: CLAUDE_CODE_SESSION_ID is interpolated into path.join without validation, so an id containing `../` can point the read at any *.jsonl file. The suffix forces .jsonl, and the only fields consumed are usage counters. However, lastUsageTokens (pre-existing, context.mjs:41) sums with `+`, so a string-valued usage field would be echoed in context_tokens (probed: "STR-IN-USAGE00"). Exploiting it needs control of the process environment, which is already code-execution level, so it is not a boundary crossing. Fix is cheap: validate the id and Number()-coerce the usage fields.
2. scripts/usage-estimate.mjs:65, low/informational: last_reading.ts echoes the raw ts string from the log. Date.parse is lenient, so a non-ISO date-like string can pass through. Only rows that also carry numeric cloud_credits qualify. No action needed.

No network exposure added (no daemon or listener in this diff). No shell-out in product code; the only spawn is in the test.
