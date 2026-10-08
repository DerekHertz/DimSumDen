# 141 developer round 3 (security bounce 1)

Branch feat/141-steering-approvals-2 at f176d3c, started from main f0e294c. The old branch feat/141-steering-approvals (6efaaa1) is untouched.

```json
{
  "ticket": "organism-infra/141-steering-approvals",
  "cell": "developer",
  "current_step": "Rebuilt the whole of 6efaaa1 as four fresh commits on feat/141-steering-approvals-2 with no whole fake secret literal in any commit (gitleaks detect --log-opts=origin/main..HEAD: 4 commits scanned, no leaks). Fixed the medium and one low. npm test: 2475 pass, 0 fail.",
  "artifacts": [
    "apps/bridge/cells/approvals.mjs",
    "apps/bridge/cells/approvals-mask.test.mjs"
  ],
  "decisions": [
    "Commits: f485b33 tests (qa's two test files, with the runtime-built secrets from 6efaaa1 already in the first commit), 3e777ee feature code (identical to 4108cbf), 155ddc6 bridge-auth stale-route fix (identical to 6efaaa1), f176d3c the security fixes. Tree apps/ is identical to 6efaaa1 except the f176d3c changes.",
    "Medium fixed: cleanText now masks only the span each SECRET_PATTERNS entry matches (overlaps merged). A private key block is masked through its END line, or to the end of the text if unterminated, since the pattern matches only the header. SECRET_PATTERNS is reused from scripts/exposure.mjs as global copies; exposure.mjs is unchanged.",
    "The per-key check in sanitize() (key=JSON value matches a secret, so the value is masked whole) is kept: that match covers the whole quoted value, so it is already span-sized.",
    "Low fixed: UNSAFE now escapes U+200B-U+200F, U+2028-U+202E, U+2060, U+2066-U+2069, U+FEFF, U+061C, written as \\u escapes in source.",
    "New tests live in approvals-mask.test.mjs; qa's host-approvals.test.mjs is untouched on this branch (only the 6efaaa1 runtime-built secret edit, already in commit one)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Low not fixed: decide() ignores the TTL timer once a decision is claimed, so an allow mid-audit at expiry still lands. Window is the audit append only; optional per the bounce.",
      "owner": "orchestrator"
    },
    {
      "item": "Re-run qa verify (light) and security on feat/141-steering-approvals-2; a PR range from this branch carries no gitleaks hit.",
      "owner": "qa"
    }
  ]
}
```
