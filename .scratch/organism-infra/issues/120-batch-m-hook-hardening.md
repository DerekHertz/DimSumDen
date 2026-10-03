# 120: Harden the batch M hook scripts (security nits from #142)

**Type:** fix

**Priority:** P2

**Blocked by:** None

**Status:** parked

## What to build

Security passed batch M (#142) with nits (handoff `109-security.md`). These scripts run on every Claude Code session, so fix them together:

1. **Medium,** `scripts/statusline.mjs:76-88`: a failed usage read is never cached, so while `usage.mjs` fails every refresh spawns node and an api.anthropic.com call for up to 4 s. Write a negative cache / backoff stamp on failure.
2. **Low-medium,** `scripts/session-start.mjs:56`: PR titles reach the orchestrator's context (which has merge authority) with only a 60-char cap. Strip control and format characters and label the PR block as untrusted data.
3. **Low,** `scripts/statusline.mjs:119-120`: lock-file cell/mode tokens print raw to the terminal; allowlist `[a-z-]+`.
4. **Low,** `scripts/session-start.mjs:81`: `r.kind`/`r.ref` from the requests log print raw; sanitise the same way.
5. **Low,** `scripts/notify.mjs:109-113`, `scripts/statusline.mjs:81`: write state and cache files atomically (temp file + rename).

Files: `scripts/statusline.mjs`, `scripts/session-start.mjs`, `scripts/notify.mjs` (+ their tests).

## Acceptance criteria

- [ ] A failing usage read is retried at most once per 60 s (test with a failing `STATUSLINE_USAGE_SCRIPT`)
- [ ] PR titles, request kinds/refs and lock tokens with ESC/OSC, C1 or bidi characters are not written raw; the SessionStart PR block is labelled untrusted (tests)
- [ ] Cache and state writes are atomic
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed from batch M's security review (pass with nits), #142 merged.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
