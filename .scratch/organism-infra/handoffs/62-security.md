# Handoff: organism-infra/62 security review

Verdict: Security pass (no critical or high findings). Branch organism-infra/62-impl at 2e9debb, diffed against tests commit a045e24 (impl commit touches only apps/organism-infra/board-service.mjs, +12 lines in publishHandoff). No dependency, lockfile, workflow, or .claude change.

```json
{
  "ticket": "organism-infra/62-handoff-name-matches-ticket",
  "cell": "security",
  "current_step": "review complete; verdict Security pass, handoff published, ready to release",
  "artifacts": [
    "apps/organism-infra/board-service.mjs",
    "apps/organism-infra/board-handoff-name-prefix.test.mjs"
  ],
  "decisions": [
    "Prefix guard (board-service.mjs:1074-1080): runs right after the HANDOFF_NAME_RE and '..' checks and before any filesystem access, so a refused name touches nothing. The regex /^(\\d{2})-/ only matches exactly two digits then a dash, so 100-x.md or 1-x.md skip the guard, but they cannot escape the handoffs dir either (path.dirname(dest) check plus assertWithinRoot are unchanged). The error interpolates name (already regex-validated) and ref, so no injection into the message.",
    "Earlier-claim guard (board-service.mjs:1162-1164): with a lock, a destination older than the lock is refused even when cell/mode match. This only tightens the previous rule (fail closed). It runs after the lstat symlink and regular-file checks, so it adds no new path to write through a symlink.",
    "Path traversal and symlinks: unchanged and still enforced (name regex, '..' rejection, dirname equality, assertWithinRoot before and after mkdir, symlink refusal on dir and dest, --from symlink refusal, 256 KB cap).",
    "Ran apps/organism-infra/board-handoff-name-prefix.test.mjs: 4 of 4 pass.",
    "Secrets: gitleaks is not installed (no ~/.local/bin, not on PATH), so I fell back to a pattern grep (AWS, GitHub, sk-, Slack, private key headers, key/secret/token/password assignments) over the two changed files. No matches. This is a manual pattern check, not a gitleaks run over origin/main..2e9debb."
  ],
  "failures": [
    "gitleaks missing: ~/.local/bin does not exist and 'which gitleaks' exits 1. Fell back to a pattern grep on the two changed files."
  ],
  "pending": [
    {"item": "Install gitleaks to ~/.local/bin so the secret scan can run per genome", "owner": "user"},
    {"item": "Optional hardening, findings 1 and 2 (low), as follow-up tickets if wanted", "owner": "orchestrator"},
    {"item": "Propose PR and merge of organism-infra/62-impl after the relay continues", "owner": "orchestrator"}
  ]
}
```

## Findings

1. apps/organism-infra/board-service.mjs:1162, low (usability, not exploitable): the earlier-claim refusal also blocks a legitimate same-cell re-publish after a reclaim or re-claim (lock is newer than your own earlier file). The intended workaround is a different --name. Fails closed, so no security impact.
2. apps/organism-infra/board-service.mjs:1151-1169, low (pre-existing, not introduced here): publishHandoff does the lstat, ownership check, and atomicWrite outside withWriteLock, so two concurrent publishers to the same name can race (check-then-write). Ownership is also decided by file mtime, which any local process can touch. Both need local same-user access, so this is not a boundary crossing.
3. apps/organism-infra/board-service.mjs:1074, low/informational: a --name with no NN- prefix (e.g. developer.md) is still accepted and skips the prefix guard, so two tickets in one feature could collide on it. The cell/mode/claim overwrite guards still apply, so it cannot silently replace another cell's file. Matches the ticket's stated scope.

No network exposure added. No shell-out added. No untrusted text reaches a shell, a UI, or a path beyond the already-validated name.
