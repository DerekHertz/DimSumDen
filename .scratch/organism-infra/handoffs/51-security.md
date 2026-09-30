# Security review: organism-infra/51 @ 2093a79

Verdict: Security pass

## Scope
Diff origin/main...2093a79: board-service.mjs (publishHandoff), cell-start.mjs, log-cell.mjs, usage.mjs, plus tests. No dependency, lockfile, or .github changes. `npm audit`: 0 vulnerabilities.

## Findings (none blocking)
- apps/organism-infra/board-service.mjs:1147-1153 (low): `ownDraft` lets the claim holder overwrite an existing handoff file newer than the lock without a cell/mode match. Bounded: the file must be published under this claim (mtime >= lock mtime), parsed.cell must equal the lock cell, and name/path checks (HANDOFF_NAME_RE, dirname check, lstat, assertWithinRoot) still run first. mtime is a soft proof and there is no write lock around the lstat/atomicWrite window (pre-existing).
- apps/organism-infra/board-service.mjs:1108-1130 (low): the State block's `cell` is not checked against the lock's cell, only filled when absent (pre-existing behavior). A holder can publish a block naming another cell. Not introduced here; consider a mismatch check later.
- scripts/cell-start.mjs:24-27 (low): `--branch` only rejects values starting with `--`; a single-dash value reaches `git switch`. Pre-existing on the `-c` path, and git refuses such branch names in normal use. Consider `git switch -q -- ` or `git check-ref-format --branch`.
- scripts/log-cell.mjs:60-93 (low): handoff-existence check reads only files named `NN-*.md` under the handoffs dir via readdirSync + statSync (no user-supplied path, no traversal). It is a process guard, not an integrity control; `--allow-no-handoff` reason is length-capped and logged. Fine.
- scripts/usage.mjs:40 (info): 401 message is static; response body and token are not printed.

## Checks
- Shell-out: cell-start uses spawnSync with array args, no shell. No new exec paths.
- Path traversal: handoff name validated and dest dir contained; `--from` symlink and size checks retained.
- Localhost binding: no daemon/network code touched.
- Untrusted text: State block is JSON.parse'd, validated by validateState, re-serialized with JSON.stringify when filled; no shell or path use.
- Secrets: gitleaks not installed here (~/.local/bin/gitleaks missing), so fell back to a pattern grep over `git log -p origin/main..2093a79` (AWS, GitHub, sk-, Slack, private key, JWT, key=value forms). No hits. Weaker than gitleaks; re-run it where available if desired.
- Dependencies: none added or upgraded.

## State

```json
{"ticket":"organism-infra/51","cell":"security","current_step":"security review complete, verdict pass","artifacts":["branch organism-infra/51-wip @ 2093a79"],"decisions":["no blocking findings; 4 low findings noted","gitleaks missing, used pattern grep fallback"],"failures":[],"pending":[]}
```
