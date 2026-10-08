```json
{"ticket": "organism-infra/167-usage-429-backoff", "cell": "developer", "current_step": "Shared usage cache, 429 cooldown, stale fallback and read lock implemented on feat/167-usage-429-backoff (commit dac92c8). All 13 tests in scripts/usage-cache.test.mjs pass; one qa test fails the root secret scan (see pending).",
 "artifacts": ["scripts/usage-claude.mjs", "scripts/statusline.mjs", "scripts/usage-keychain.test.mjs"],
 "decisions": ["Cache file is ~/.claude/usage-cache.json (os.homedir()), JSON {at, windows, cooldown_until}, mode 0600, written via tmp+rename; lock is ~/.claude/usage-cache.json.lock (openSync wx, 30 s stale, 15 s wait).", "Cache is checked before findToken, so a fresh hit skips the Keychain read.", "Statusline keeps its 60 s layer (allowed: 'or defer'): it only saves a node spawn and adds no network call; the 5 minute cache and cooldown live in usage-claude.mjs. Only its header comment changed.", "Live reading prints source:live, age_s:0 (ticket criterion 3), so I updated EXPECTED in scripts/usage-keychain.test.mjs to carry those two fields; no other assertion changed.", "Retry-After accepts seconds or an HTTP date, capped at 1 hour; default cooldown 300 s.", "A 401 with a cached reading also falls back to stale (exit 0); with no cache it keeps the old nonzero exit and login message.", "hook-io.mjs and bridge conformance.mjs need no change: both spawn usage.mjs and share the cache."],
 "failures": [{"what": "npm test: 'no tracked text file outside the board trips the root secret scan' fails on scripts/usage-cache.test.mjs", "why": "qa's test has the literal TOKEN = \"SECRET-TOKEN-167-abcdef\" which hasSecret flags. The auto-mode classifier denied my sed to build it at runtime (it is qa's test), so I left it."}],
 "pending": [{"item": "Fix scripts/usage-cache.test.mjs line 26: build TOKEN at runtime, e.g. [\"synthetic\",\"usage\",\"cache\",\"167\",\"marker\"].join(\"-\"), then re-run scripts/root-secret-scan.test.mjs. Otherwise CI is red.", "owner": "qa"}]}
```

## State
in-review. Implementation done; one qa-owned test literal trips the root secret scan.

## What changed
- `scripts/usage-claude.mjs`: shared cache (5 min, `USAGE_CACHE_TTL_MS` seam), 429 cooldown, stale fallback (`stale:true, source:"cache", age_s`, exit 0), live readings carry `source:"live"`, lock file so concurrent readers make one call, sanitized errors unchanged.
- `scripts/statusline.mjs`: comment only.
- `scripts/usage-keychain.test.mjs`: EXPECTED gains `source:"live", age_s:0`.

## Verification
`node --test` on usage-cache, usage-keychain, usage-401, usage-provider, statusline: 77 pass, 0 fail. Full `npm test`: 3005 pass, 5 fail before my keychain test fix; the 4 keychain failures are fixed, the remaining one is the secret scan above.

## Next step
qa (or whoever owns the test) fixes the literal, then qa verify.

## Gotchas
Not human-verified: real 429 behavior against the live endpoint.
