# 152: session tokens expire

**Type:** feature

**Priority:** P2

**Blocked by:** 139

**Status:** ready-for-agent

**Serves:** Steering security: shrinks the 139 security residual M1.

## What to build

The UI keeps the session token in `sessionStorage` (ADR 0016 decision 7), and browsers can persist that store to the profile directory for session restore, where any process on the account can read it. Tokens issued by `apps/bridge/auth.mjs` never expire. Give tokens a lifetime (and optionally an idle timeout) so a token read from disk goes stale. An expired token gets 401, which already clears it in the UI. Decide the lifetime with the user during qa specify, and record it in ADR 0016 decision 7.

## Acceptance criteria

- [ ] A token past its lifetime is refused with 401 (test with an injected clock)
- [ ] The lifetime is one config value, recorded in ADR 0016 decision 7
- [ ] The UI falls back to the no-session line after expiry (existing 401 path, test)

## Comments

- **orchestrator, 2026-10-06:** From 139 security finding M1 (139-security.md). The user accepted M1 as a residual for 139 and asked for this follow-up.
