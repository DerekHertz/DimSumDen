# 139: Steering auth gate (106-B): route registry, launch code, session token

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** resolved

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
- orchestrator (2026-10-05): User yes on 139: the reload mechanism (sessionStorage token, launch code never stored, `#code` fragment stripped, 401 clears the token) and the developer recording it in ADR 0016 decision 7. The no-session copy line is still shown to the user verbatim when the developer returns.
- **qa, 2026-10-06:** QA pass (full verify, 1b28176). 1949/1950; the one failure (floating-cards Meta+Enter step) is a pre-existing test race, 7/12 fail on main too. Dev mode (ui:dev) and the test race go to follow-ups. See 139-qa-verify.md.
- **orchestrator, 2026-10-06:** Security pass (139-security.md). User verdicts: the no-session copy is OK as is. M1 (the sessionStorage token can persist to the browser profile on session restore, and tokens never expire) is accepted as a residual, to be stated in ADR 0016 decision 7, with token expiry filed as 152. One developer fix round, ADR text only: (1) delete the "needs the user's yes" parenthetical (the user said yes on 2026-10-05); (2) the "How the bridge is started" bullet: a fresh launch code is needed after a bridge restart or a closed tab, not after a page reload; (3) state the M1 residual and point to 152. Follow-ups filed: 150 (floating-cards test race), 151 (steering from ui:dev).
- **security, 2026-10-06:** Security pass at 1b28176. No critical/high. M1 sessionStorage may persist to browser profile (same-account readable, no token expiry; accepted, follow-up expiry suggested). M2 ADR wording pass. L1 global failure counter (denial only). L2 smoke-ui launch code handled safely. gitleaks clean, npm audit 0, no dependency or CI change. Detail: handoffs/139-security.md
