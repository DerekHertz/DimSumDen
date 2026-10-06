# 151: steering from the Vite dev server (ui:dev)

**Type:** design-question

**Priority:** P2

**Blocked by:** 139

**Status:** ready-for-agent

**Serves:** Developer experience: with `npm run ui:dev`, POST /session and POST /requests get 403, so steering can't be tested with hot reload.

## What to build

Through `npm run ui:dev`, Vite forwards its own Origin, so the bridge's required-Origin check refuses /session and /requests (it fails closed, and the page shows the no-session line). ADR 0016 decision 6.1 says "if the Vite dev origin is ever allowed, it is one exact allowlist entry", but it limits `startBridge` auth options to `launchCode`, `ttlMs` and `now`. An architect decides whether and how to allow the dev origin (one exact entry, dev only), amending ADR 0016 if needed; a developer then builds it.

## Acceptance criteria

- [ ] Architect decision recorded (ADR 0016 amendment or a "won't do" with reason)
- [ ] If allowed: exactly one dev Origin entry, absent from the production bridge, with tests for both

## Comments

- **orchestrator, 2026-10-06:** Found by 139 qa verify and security (vite.config.mjs proxies /session, but the Origin check refuses it). Filed with the user's yes. Behind den-v1.
