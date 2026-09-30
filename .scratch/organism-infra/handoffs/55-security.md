# Handoff: organism-infra/55 security review

Verdict: Security pass. Branch organism-infra/55-impl @ 2eb4f37. No critical or high findings.

## Findings (medium/low, non-blocking)

- apps/organism-infra/board-service.mjs:~817 (reclaim), low: reclaim still validates against CLAIM_MODES only, so `reclaim designer --mode review` is rejected, and reclaiming a qa specify lock rewrites it without the prior-status token (restore then no-ops and the status stays `claimed`, the old behavior). Fail-safe, functional gap only.
- board-service.mjs:1244, low: designer verdict needs lock mode `review`, but identity is self-declared at claim (existing model, same as qa/security). A designer verdict only feeds the bounce counter in appendResolvedRow; it gates nothing. Accepted.
- board-service.mjs claim keepInReview, low: a designer review claim on an in-review ticket sets `claimed` (only security/qa keep in-review). Not a vulnerability; check the designer flow is intended.

## Lock token parsing (checked)

- 4th token is written only for qa+specify from fromStatus in {ready-for-agent, blocked}, and read back through an allowlist (ready-for-agent | blocked). No free-text reaches the status line, a path or a shell.
- Restore fires only when keep-status, cell qa, mode specify, and the current status is `claimed`. A tampered lock can at most set ready-for-agent/blocked on a qa specify claim; no privilege gain.
- mode is allowlist-validated before it is written, and the timestamp is ISO, so whitespace cannot shift token positions.
- The release path (`--status in-review|resolved` rules, handoff gate) is untouched.

## Scans

- gitleaks is not installed (~/.local/bin/gitleaks missing). Fell back to a pattern grep over `git log -p origin/main..2eb4f37` (AWS, GitHub, Slack, sk- keys, private key headers, key/secret/token assignments): no hits.
- No dependency, lockfile, or .github changes. `npm audit`: 0 vulnerabilities.
- Ran board-status-friction and board-claim-ergonomics tests: 22/22 pass.

```json
{"ticket":"organism-infra/55-board-status-friction","cell":"security","current_step":"Security pass; medium/low notes only","artifacts":[],"decisions":["Security pass"],"failures":["gitleaks not installed; used pattern grep"],"pending":[]}
```
