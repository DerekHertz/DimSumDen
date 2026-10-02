# 106: Steering slice 1: dispatch, watch, approve, kill

**Type:** feature

**Priority:** P1

**Blocked by:** 105

**Status:** ready-for-agent

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
