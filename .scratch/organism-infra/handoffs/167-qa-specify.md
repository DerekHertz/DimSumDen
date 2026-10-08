```json
{"ticket": "organism-infra/167-usage-429-backoff", "cell": "qa", "mode": "specify", "current_step": "Failing tests committed on feat/167-usage-429-backoff; 11 of 13 red for the right reason (feature missing), 2 already pass by design.",
 "artifacts": ["scripts/usage-cache.test.mjs"],
 "decisions": ["Cache file must live under os.homedir() (follows $HOME); tests find it by scanning the fake home, so its name is the developer's choice.", "Env USAGE_CACHE_TTL_MS overrides the 5 minute freshness (default 300000); a test seam the developer must implement.", "Fresh cache hit prints source:\"cache\" without stale:true; live read prints source:\"live\"; stale (cooldown or failed read) prints stale:true, source:\"cache\", age_s.", "Retry-After is read as whole seconds; with no header the cooldown is 5 minutes.", "Bridge conformance.mjs spawns usage-claude.mjs directly, so it shares the cache with no change and has no separate test."],
 "failures": [],
 "pending": [{"item": "Implement the shared cache, cooldown, lock and statusline change until scripts/usage-cache.test.mjs passes; keep all existing tests green", "owner": "developer"}]}
```

## State
done. Tests written and red.

## What changed
Branch feat/167-usage-429-backoff, commit dc1faa8 (tests only): `scripts/usage-cache.test.mjs`. Base a8f0e44.

Harness: a `--import` preload replaces fetch, counts calls in a file and answers from a behavior file (status, headers, body, delay, throw). HOME is a temp dir with a fake credentials file. Runs `node scripts/usage.mjs` and `node scripts/statusline.mjs` as subprocesses.

## Criterion to test map
- AC1 two reads, one call: "AC1: two reads within 5 minutes..." and "AC1: a reading older than the TTL..."
- AC2 429 cooldown and Retry-After: "AC2: a 429 is not retried..." (Retry-After 2 s, waits 2.5 s) and "AC2: without Retry-After..." (default cooldown)
- AC3 stale output, exit 0: "AC3: during a cooldown..." and "AC3: any failed read (HTTP 500, network error)..."
- AC4 no cache, nonzero and sanitized: "AC4: persistent failure with no cache..."
- AC5 statusline: "AC5: the statusline makes no network call..." (fails now), "AC5: repeated statusline refreshes on a cold cache..." (passes now, regression guard), "AC5: during a 429 cooldown the statusline keeps showing the cached reading..."
- AC6 concurrency: "AC6: concurrent reads make at most one network call" (4 parallel processes, 600 ms fetch)
- AC7 no credentials: "AC7: no token or credential text..." and "AC7: the cache holds only windows..." (no raw body stored)
- AC8 existing tests still pass: not a new test; run `npm test`.
- Nothing is human-verified.

## Next step
developer: implement in scripts/usage-claude.mjs, then scripts/statusline.mjs.

## Suggested skills
tdd, implement.

## Gotchas
- Existing tests in `scripts/statusline.test.mjs` pin the statusline's own 60 s cache: "AC3: the usage read is cached on disk" (line 163), "AC3: a cache older than 60 s" (173) and the `calls(f) === 1` check in the AC4 warm-cache timing test (201). The ticket authorizes dropping or deferring that cache. If the developer drops it, rewriting or removing exactly those cache assertions is sanctioned; verify must check they are not loosened otherwise. If the developer keeps a statusline layer on top of the shared cache, they pass unchanged.
- Two tests wait on the clock (about 2.5 s each); the suite stays well under a minute.
- The statusline tests rely on NODE_OPTIONS carrying the fetch preload into the usage.mjs child, so statusline must keep spawning the usage script (or import it) in-process-environment-compatibly. Calling fetch through any path is intercepted.
- Lock or stale-lock handling: the concurrency test starts 4 processes at once; losers must wait for the winner's cache, not fail.
