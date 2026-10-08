# 167: One shared usage cache with a 429 cooldown, so usage reads stop tripping the rate limit

**Type:** bug

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Usage gates (usage-watch skill). Retro 2026-10-06: `node scripts/usage.mjs --provider claude` returned `HTTP 429` at the 147 merge and again at session start. The user reports 429s "semi-regularly" and asked to scale back usage reads (2026-10-06).

## Why

Several callers hit the usage endpoint on their own: the statusline (`scripts/statusline.mjs`, 60 s cache per refresh, every open session), hooks through `scripts/hook-io.mjs`, the bridge (`apps/bridge/cells/conformance.mjs`), and the orchestrator's gate checks. The statusline saves only good readings, so during a 429 every refresh calls the API again.

## What to build

1. Move caching into `scripts/usage-claude.mjs`, so every caller shares one cache. A reading younger than **5 minutes** (user decision, 2026-10-06) is served from the cache without a network call. The cache file lives outside the repo's tracked files and holds only the canonical `{"5-hour":{...},"weekly":{...}}` windows and a timestamp.
2. On HTTP 429, do not retry. Record a cooldown (`Retry-After` if present, else 5 minutes) and make no network call until it ends. During the cooldown, or after any failed read, print the cached reading with `"stale": true`, `"source": "cache"` and `"age_s"`, and exit 0. With no cache, keep today's nonzero exit and sanitized diagnostic.
3. Live readings carry `"source": "live"`. The usage-watch rule stays the same: a stale reading is attributed as stale, never as live.
4. Drop the statusline's own 60 s cache (or set it to defer to the shared one), so it makes no extra calls. Hooks and the bridge read through the same path.
5. Concurrent callers must not stampede: two reads in the same instant make at most one network call (a lock file or an atomic write with a recheck is enough).

Files: `scripts/usage-claude.mjs`, `scripts/statusline.mjs`, `scripts/hook-io.mjs` if needed, `apps/bridge/cells/conformance.mjs` if needed, and their tests (see `scripts/usage-401.test.mjs` for the HTTP stub pattern).

## Acceptance criteria

- [ ] Two reads within 5 minutes make one network call; the second is served from the cache (test with a stubbed server counting requests)
- [ ] After a 429, no network call is made until the cooldown ends; `Retry-After` sets the cooldown when present (test)
- [ ] During a cooldown with a cached reading, output carries `stale: true`, `source: "cache"` and `age_s`, and the exit code is 0 (test)
- [ ] Persistent failure with no cache exits nonzero with a sanitized message, as today (test)
- [ ] The statusline makes no network call of its own when the shared cache is fresh (test)
- [ ] Concurrent reads make at most one network call (test)
- [ ] No token or credential text appears in the cache file or in any output (test)
- [ ] Existing usage, statusline and hook tests still pass

## Comments
- **orchestrator, 2026-10-08:** User 2026-10-08: raised to P1. usage.mjs returned HTTP 429 at every read tonight, so dispatch and merge gates fell back on the session-start reading.
- **Retro (orchestrator, 2026-10-08):** 429 hit 5 times across 207 and 208 (session start and several dispatches), so this is the next recommended infra ticket.
