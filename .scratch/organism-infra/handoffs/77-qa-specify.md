```json
{"ticket": "organism-infra/77", "cell": "qa", "mode": "specify",
 "current_step": "Failing tests committed on tests/77-shared-exposure-module (f05777f); all 39 tests fail for missing-feature reasons.",
 "artifacts": ["scripts/exposure.test.mjs"],
 "decisions": [
   "AC5 (dead claimMtimeMs branch removal) marked human-verified — testing source removal is an implementation detail, not behavior.",
   "AC4 route-bounce/wake tests fail via TypeError (point undefined in POINTS) — acceptable; the root cause is the missing feature.",
   "AC3 tests use cliNoKey (no API key) so path rejection must happen before decide() is called; usage row count is the key signal.",
   "One-source tests (AC1) scan jev.mjs and risk-check.mjs source for import statements — clearest way to assert shared-source property."
 ],
 "failures": [],
 "pending": [
   {"item": "Create scripts/exposure.mjs exporting DENIED_PATHS, isDenied(path), hasSecret(text); re-point jev.mjs and risk-check.mjs imports to it", "owner": "developer"},
   {"item": "Add missing secret patterns to hasSecret: unquoted env lines, Authorization: Bearer, JWT, sk_live_, github_pat_, gho_/ghs_/ghu_, npm_, URL creds, aws_secret_access_key, xoxr-/xoxs-/xoxe-, glued-prefix shapes", "owner": "developer"},
   {"item": "Add --tests path validation in jev.mjs main() before decide(); reject and exit non-0 for denied paths, symlinks, directories, >1 MB files", "owner": "developer"},
   {"item": "Add route-bounce and wake points to decide() with correct input allowlisting; wake suppresses transport for user/Scope-added/verdict events", "owner": "developer"},
   {"item": "Remove dead claimMtimeMs branch in apps/organism-infra/board-service.mjs (ticket 46 absorbed)", "owner": "developer"}
 ]}
```

## State
Done. All 39 failing tests committed on `tests/77-shared-exposure-module` (SHA `f05777f`).

## What changed
Branch: `tests/77-shared-exposure-module`  
Commit: `f05777f` — `scripts/exposure.test.mjs` (452 lines, 39 tests)

## Criterion-to-test map

**AC1 — exposure.mjs exports + shared source:**
- `exposure.mjs exports DENIED_PATHS as a non-empty array` → ERR_MODULE_NOT_FOUND
- `exposure.mjs exports isDenied as a function` → ERR_MODULE_NOT_FOUND
- `exposure.mjs exports hasSecret as a function` → ERR_MODULE_NOT_FOUND
- `isDenied returns true for .env paths` → ERR_MODULE_NOT_FOUND
- `isDenied returns true for credentials files` → ERR_MODULE_NOT_FOUND
- `isDenied returns true for .pem and .key files` → ERR_MODULE_NOT_FOUND
- `isDenied returns true for paths inside a dot-directory` → ERR_MODULE_NOT_FOUND
- `isDenied returns true for paths inside .scratch handoffs and _handoffs` → ERR_MODULE_NOT_FOUND
- `isDenied returns true for _requests paths and *.lock files` → ERR_MODULE_NOT_FOUND
- `isDenied returns true for usage.jsonl` → ERR_MODULE_NOT_FOUND
- `isDenied returns false for a normal test output file in /tmp` → ERR_MODULE_NOT_FOUND
- `jev.mjs imports from exposure.mjs, not risk-check.mjs` → assertion (current import is from risk-check.mjs)
- `risk-check.mjs imports SECRET_PATTERNS from exposure.mjs, not defining its own` → assertion (still defines its own)

**AC2 — hasSecret catches every listed shape:**
- `hasSecret catches unquoted NAME_KEY=value env lines` → ERR_MODULE_NOT_FOUND
- `hasSecret catches Authorization: Bearer token shape` → ERR_MODULE_NOT_FOUND
- `hasSecret catches JWT shape (three dot-separated base64url segments)` → ERR_MODULE_NOT_FOUND
- `hasSecret catches sk_live_ API key shape` → ERR_MODULE_NOT_FOUND
- `hasSecret catches github_pat_ token shape` → ERR_MODULE_NOT_FOUND
- `hasSecret catches gho_, ghs_, ghu_ token shapes` → ERR_MODULE_NOT_FOUND
- `hasSecret catches npm_ token shape` → ERR_MODULE_NOT_FOUND
- `hasSecret catches URL credentials (user:password@host)` → ERR_MODULE_NOT_FOUND
- `hasSecret catches aws_secret_access_key assignment shape` → ERR_MODULE_NOT_FOUND
- `hasSecret catches Slack xoxr-, xoxs-, xoxe- shapes (ticket 46)` → ERR_MODULE_NOT_FOUND
- `hasSecret catches glued GitHub token prefix e.g. GH_ghp_... (ticket 46)` → ERR_MODULE_NOT_FOUND
- `hasSecret does not flag prose, prefixes alone, or short lookalikes` → ERR_MODULE_NOT_FOUND
- `hasSecret: a new shape early in text >16k still blocks (secret before truncation window)` → transport called (sk_live_ not blocked by existing patterns)

**AC3 — --tests path validation:**
- `--tests rejects a .env file and writes no usage row` → exit 0 instead of non-0
- `--tests rejects a credentials file and writes no usage row` → exit 0
- `--tests rejects a .pem file and writes no usage row` → exit 0
- `--tests rejects a .key file and writes no usage row` → exit 0
- `--tests rejects a file inside a dot-directory and writes no usage row` → exit 0
- `--tests rejects a file inside .scratch handoffs and writes no usage row` → exit 0
- `--tests rejects usage.jsonl and writes no usage row` → exit 0
- `--tests rejects a symlink (even to a non-denied target) and writes no usage row` → exit 0
- `--tests rejects a directory path and writes no usage row` → exit 0
- `--tests rejects a file over 1 MB and writes no usage row` → exit 0

**AC4 — per-point allowlisted inputs:**
- `route-bounce: decide handles the point and includes bounce comment in transport text` → TypeError (POINTS["route-bounce"] undefined)
- `wake: decide handles the point and includes new comment but not handoff text` → TypeError (POINTS["wake"] undefined)
- `wake: user-authored comment, Scope added, and verdict events produce zero transport calls` → TypeError

**AC5 — 46's dead release-gate code removed:** human-verified

## Next step
Developer: implement `scripts/exposure.mjs`, rewire imports, add `--tests` validation, add `route-bounce` and `wake` points to `decide()`, remove dead `claimMtimeMs` branch. Then qa runs light verify from this specify SHA.

## Suggested skills
`tdd`, `implement`

## Gotchas
- Fixtures built at runtime (`body(n)` helper) to avoid CI gitleaks triggering on token-shaped literals.
- `sk_live_` and `sk-` are distinct shapes (underscore vs dash). The existing `sk-` pattern does NOT cover `sk_live_`.
- route-bounce and wake tests fail via TypeError (`p.labels` on undefined) because `POINTS` lookup returns undefined. This is the correct failure mode.
- AC3 tests check `r.status !== 0` as the primary assertion; the `usageRows.length === 0` is secondary but equally required.
