# 139: Steering auth gate (106-B): route registry, launch code, session token

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4: every steering route sits behind this gate.

Scope source: ADR 0016 (as amended in PR #157) and the split table in `.scratch/organism-infra/handoffs/106-architect.md`. Parent: 106.

## What to build

Route registry with default deny; Host check, required Origin, Content-Type, 4 KB body cap, Bearer (sha256 + timingSafeEqual); auth runs before any id lookup. `POST /session` redeems a one-time launch code (5-minute TTL, burned on first use or after 5 failures, max 4 sessions) for a session token. `startBridge` gets an `auth` option; the console prints the launch URL (code only, never logged). Retrofit `POST /requests`. The UI reads `#code`, redeems it, and sends Bearer; update `bridge-requests.test.mjs` and the Approve/Reject buttons (`gates-model.mjs`, `floating-cards.test.mjs`) in this ticket. Nothing can disable or preset the token.

**User decision (2026-10-05): a page reload keeps the session.** The user should not need a new launch code after a reload. The mechanism (e.g. token in `sessionStorage`) is settled in qa specify and reviewed by security; record it in ADR 0016 decision 7, closing that open item.

## Acceptance criteria

- [ ] Table-driven auth tests generated from the one route registry cover every route, including `POST /requests`.
- [ ] An unknown route and an unauthenticated known route are both refused before any id lookup.
- [ ] Launch code: TTL, single use, burn after 5 failures, 4-session cap, each tested.
- [ ] The launch code never appears in logs.
- [ ] The UI redeems `#code`, sends Bearer, and Approve/Reject still work.
- [ ] Reloading the page keeps the session without a new code; the mechanism is recorded in ADR 0016 decision 7.
- [ ] The "no session / code already used" state shows one line of copy (designer glance or orchestrator call).

## Comments

- orchestrator (2026-10-05): Largest of the split (100-120k). Full qa specify and full security.
