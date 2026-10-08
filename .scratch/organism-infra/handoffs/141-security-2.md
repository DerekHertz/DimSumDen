# 141 security review, round 2 (f176d3c)

Verdict: Security pass.

```json
{
  "ticket": "organism-infra/141-steering-approvals",
  "cell": "security",
  "current_step": "Reviewed origin/main...f176d3c (feat/141-steering-approvals-2) by hand and with gitleaks. All findings from the first bounce are resolved or accepted. No critical or high finding.",
  "artifacts": [
    "apps/bridge/cells/approvals.mjs",
    "apps/bridge/cells/approvals-mask.test.mjs"
  ],
  "decisions": [
    "gitleaks detect --log-opts=origin/main..f176d3c: 4 commits scanned, no leaks. The curl-auth-header hit is gone from history because the branch was rebuilt with the fixture built at runtime from the first commit.",
    "Re-ran approvals-mask, host-approvals and bridge-auth tests: 157 pass, 0 fail.",
    "No dependency added, no workflow change, so no npm audit or CI review needed (npm ci reported 0 vulnerabilities)."
  ],
  "failures": [],
  "pending": []
}
```

## Findings

Resolved from round 1
- HIGH (gitleaks, host-approvals.test.mjs:414): not present in any commit of the new range.
- MEDIUM (approvals.mjs maskSecrets, cleanText): now masks only the matched span, merged on overlap; private key blocks masked through the END line or end of text. A secret-shaped token no longer hides the rest of a command. The per-key check in sanitize() (approvals.mjs:87) only masks a value that is itself span-sized and limited to the token charset, so it cannot hide a command containing spaces.
- LOW (UNSAFE class): zero-width, bidi, line-separator and BOM characters now escaped as visible \uXXXX (approvals.mjs:28).

Remaining, non-blocking
- LOW approvals.mjs:117-118 and :224: decide() ignores the TTL timer once a decision is claimed, so an allow mid-audit at expiry still lands. Window is one audit append, and the user made the decision. Accepted.
- LOW routes.mjs:8-10 with watch.mjs:119: unauthenticated GET /state and /events now carry the approvals list (id, tool, masked summary up to 200 chars). Ids alone grant nothing: GET and POST /approvals/:id need the session token. The agents list already exposed tool summaries the same way. Note for any future change that makes /state reachable beyond 127.0.0.1.
- LOW approvals.mjs:40-45: the patterns now run over inputs up to 256 KiB. They are documented as linear-time and the sizes are capped; the lookahead-based JWT pattern is the one to watch if inputs ever grow.

## Checked and fine
- Both routes need the session token, Host check and Origin (GET may omit Origin, no cookie auth, so no CSRF). Content-Type is skipped for GET only.
- Approval ids are 8 random bytes, validated against APPROVAL_ID_RE before lookup; no path or shell use of ids or tool text.
- Fail-closed: undecodable input, depth, size, cap, repeated id, stopping, expiry, exit and shutdown only ever answer deny; audit failure downgrades allow to deny; concurrent decisions serialised by the claim before the first await.
- Memory bounded: 20 pending per agent, 200 settled, 1000 request ids per agent, 256 KiB per input.
