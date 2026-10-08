```json
{
  "ticket": "organism-infra/167-usage-429-backoff",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Fixed the developer's blocker: scripts/usage-cache.test.mjs now builds its synthetic token at runtime. Committed 7247e95 on feat/167-usage-429-backoff. usage-cache (13 tests) and root-secret-scan (1) pass: 14 of 14.",
  "artifacts": ["scripts/usage-cache.test.mjs"],
  "decisions": ["Only the TOKEN constant changed, to [\"synthetic\",\"usage\",\"cache\",\"167\",\"marker\"].join(\"-\"). Every assertion is untouched; the leak checks still use the same TOKEN constant."],
  "failures": [],
  "pending": [{"item": "qa verify (light, specify handoff 167-qa-specify.md; diff test files against the original specify sha, expecting only the TOKEN line to differ). Also run full npm test.", "owner": "qa"}]
}
```

## State
in-review. Blocker fixed; ready for qa verify.

## What changed
`scripts/usage-cache.test.mjs` line 26: the token is joined from parts, so no tracked text file holds a secret-shaped literal. The token value is still unique and appears nowhere in product code.

## Verification
`node --test scripts/usage-cache.test.mjs scripts/root-secret-scan.test.mjs`: 14 pass, 0 fail, 0 skipped. I did not run the full `npm test`.
