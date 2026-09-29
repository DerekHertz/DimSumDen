```json
{
  "ticket": "dimsumden-ui-v0/06-bridge-requests",
  "cell": "security",
  "mode": "review",
  "current_step": "security review complete: Security pass",
  "artifacts": [],
  "decisions": ["No dependency, lockfile or CI change in the diff; no dependency gate", "Two low findings do not block"],
  "failures": [],
  "pending": [{"item": "orchestrator to propose the merge; optional low-severity hardening as a follow-up ticket", "owner": "orchestrator"}]
}
```

# Handoff: 06 security

## Verdict
Security pass at 9f0929c. No critical, high or medium findings.

## What was checked
- Diff origin/main..9f0929c (6 files): apps/bridge/server.mjs, requests-log.mjs, snapshot.mjs, scripts/requests.mjs and two test files. No package.json, lockfile or .github change.
- gitleaks over origin/main..9f0929c: 2 commits, no leaks. npm audit --omit=dev: 0 vulnerabilities.
- Network exposure: server.listen on 127.0.0.1 only. The Host check (127.0.0.1:port or localhost:port, else 403) runs before routing, so it covers POST /requests and defeats DNS rebinding.
- CSRF / cross-site writes: POST requires Content-Type application/json (a cross-site form or simple fetch cannot send it, and the bridge sends no CORS headers, so preflight fails). A present Origin must be the bridge's own loopback origin, otherwise 403 (Origin: null is also rejected). Tests cover text/plain, foreign Origin and foreign Host.
- Path traversal / injection: ref is never used as a path. It must equal a ref in the live snapshot (404 otherwise). The only file written is the fixed .scratch/_requests/requests.jsonl. Lines are JSON.stringify'd, so newlines in note cannot forge extra log lines. id and ts are server-generated (randomUUID, ISO date); the client cannot set them. Body fields other than kind, ref, note are dropped.
- Resource limits: Content-Length precheck plus a streamed 4096-byte cap (covers chunked bodies), 413 with Connection: close. note capped at 500 chars.
- Lock race: POSTs are serialised through postChain, and hub.snapshot() forces a fresh rebuild, so the pending check sees the previous append. Two racing POSTs cannot both pass. Cross-process append with requests.mjs --handle is a single small appendFile, no read-modify-write.
- Nothing executes: the handler only validates and appends. No child_process anywhere in the diff.
- Error handling: 500 path returns a generic "internal error"; stack goes to the daemon log only.

## Findings
- apps/bridge/server.mjs:103 and scripts/requests.mjs:20, low: note is only length-checked. Control characters or ANSI escapes in note are printed raw by `requests.mjs --list` to the orchestrator's terminal/context, and rendered by the UI later (React escapes HTML, so no XSS). Suggest stripping C0/C1 control characters (or rejecting them) on POST, and treating note as untrusted text in the orchestrator genome.
- apps/bridge/requests-log.mjs:61, low: the log is append-only with no rotation. After a request is handled the same ref can be re-requested, so any local process can grow the file without bound. Accepted for a localhost single-user tool; note for the follow-up if the bridge ever leaves loopback.
- Informational: no authentication on POST /requests beyond loopback and Host/Origin checks, so any local process can file a Gate request. This matches ADR 0011 decision 6 (requests are only requests; a human-gated orchestrator acts on them).

## Comments
Security pass.
