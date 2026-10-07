# 106: Steering slice 1: dispatch, watch, approve, kill

**Type:** feature

**Priority:** P1

**Blocked by:** 105, 138, 139, 140, 141, 142, 143

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 (the bridge runs agents and holds permission requests; F and A/D read it).

**Design refs:** `docs/adr/0016-ui-steering-channel.md` decision 7, slice 1

## What to build

Build ADR 0016 slice 1: `runtime.mjs` plus a fake, the Claude adapter, `host.mjs` with dispatch policy, kill and the approval hold, token and Origin hardening, and the `POST /cells` routes. `security` re-reviews decision 6 before the auth code is built.

## Acceptance criteria

- [ ] A fake runtime test dispatches, streams events, holds and answers a permission request, and kills
- [ ] Relay-hop cells are refused with 409
- [ ] The adapter cannot build a permission-broadening flag (test)
- [ ] `security` has re-reviewed decision 6 before build

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **security, 2026-10-06:** Security bounce (design review of ADR 0016 d6, no code): F1 high until spike S8 (child opens a messaging socket, contradicts 6.3), F2-F6 medium (launch-token leak, control_request contract, flag allowlist, effective permission sources, kill escalation), F7-F8 low. Hardening must land before any mutating route. See handoffs/106-security.md.
- **orchestrator, 2026-10-05:** Architect amended ADR 0016 for F1-F8 (PR #157; handoffs/106-architect.md). Split approved by the user into 138 (spike tooling), 139 (auth gate), 140 (host core), 141 (approvals), 142 (adapter pure), 143 (adapter process); 106 stays open as the parent until all six resolve. User decisions: a page reload keeps the session (goes to 139); S8 outcome (c) injection residual accepted, (d) drops approvals from slice 1.
