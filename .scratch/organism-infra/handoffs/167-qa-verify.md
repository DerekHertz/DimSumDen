```json
{"ticket": "organism-infra/167-usage-429-backoff", "cell": "qa", "mode": "verify", "current_step": "Light verify of feat/167-usage-429-backoff at 7247e95: QA pass. Suite result taken from /tmp/167-tests.txt as dispatched (3010 pass, 0 fail, 0 skipped, 0 todo). Test file diff since specify commit dc1faa8 is the TOKEN line only.",
 "artifacts": ["scripts/usage-cache.test.mjs"],
 "decisions": ["Light verify, per the dispatch line. Suite not re-run: the dispatch said to use /tmp/167-tests.txt. Its mtime (16:09:37) is after the fix commit 7247e95 (16:06:50), and it shows no not-ok lines.", "Verdict QA pass, posted with board comment --verdict pass.", "usage-keychain.test.mjs is not a qa test file, so it is listed as an out-of-scope-or-edge file below and not judged."],
 "failures": [],
 "pending": []}
```

## State
in-review. QA pass (light verify). Ready for the orchestrator to open the PR.

## What changed
Nothing in product code. Verify only: claim, diff, criterion map, verdict comment, this handoff.

## Verification
- Suite: `/tmp/167-tests.txt` (dispatched as the suite result, not re-run): `# tests 3010`, `# pass 3010`, `# fail 0`, `# skipped 0`, `# todo 0`. No `not ok` lines in the file.
- Specify test diff: `git diff dc1faa8 HEAD -- scripts/usage-cache.test.mjs` shows one changed line, 26: `TOKEN` moved from a literal to `["synthetic","usage","cache","167","marker"].join("-")`. No assertion was removed or loosened.
- Files touched since base a8f0e44 (`git diff --stat`): `scripts/usage-claude.mjs`, `scripts/statusline.mjs`, `scripts/usage-cache.test.mjs`, `scripts/usage-keychain.test.mjs`.

## Criterion to test map
- Criterion 1 (two reads within 5 min, one network call): "AC1: two reads within 5 minutes make one network call; the second is served from the cache". Also "AC1: a reading older than the TTL is fetched again (TTL seam)".
- Criterion 2 (no call until cooldown ends; Retry-After sets it): "AC2: a 429 is not retried, and no call is made until Retry-After passes"; "AC2: without Retry-After the cooldown is long (5 minutes)...".
- Criterion 3 (stale, source cache, age_s, exit 0 during cooldown): "AC3: during a cooldown with a cached reading the output is stale from the cache and exits 0"; "AC3: any failed read (HTTP 500, network error) with a cached reading falls back to it, stale, exit 0".
- Criterion 4 (no cache: nonzero, sanitized): "AC4: persistent failure with no cache exits nonzero with a sanitized message, as today".
- Criterion 5 (statusline no network call when cache fresh): "AC5: the statusline makes no network call of its own when the shared cache is fresh"; plus "AC5: repeated statusline refreshes on a cold cache make at most one network call" and "AC5: during a 429 cooldown the statusline keeps showing the cached reading and makes no calls".
- Criterion 6 (concurrent reads, at most one call): "AC6: concurrent reads make at most one network call".
- Criterion 7 (no token or credential text in cache or output): "AC7: no token or credential text in the cache file or in any output"; "AC7: the cache holds only windows, a timestamp and the cooldown (no raw API body)".
- Criterion 8 (existing tests still pass): full suite above, 3010 pass, 0 fail.
- Human-verified: none. Specify marked nothing human-verified. The developer notes that real 429 behavior against the live endpoint is not covered by tests.

## Out-of-scope or edge files (listed, not judged)
- `scripts/usage-keychain.test.mjs`: an existing test. Its `EXPECTED` object gains `source: "live"` and `age_s: 0` to match criterion 3. Existing assertions are otherwise unchanged. The file is not a qa test file, so the light rules don't cover it. Security or the orchestrator decides whether it is in scope.
- `scripts/usage-claude.mjs`, `scripts/statusline.mjs`, `scripts/usage-cache.test.mjs`: in the ticket's Files list.
- `scripts/hook-io.mjs` and `apps/bridge/cells/conformance.mjs`: not touched.

## Next step
Orchestrator: open the PR for feat/167-usage-429-backoff, then run `npm run risk-check`.

## Gotchas
Light verify only. Live-endpoint 429 behavior is not tested.
