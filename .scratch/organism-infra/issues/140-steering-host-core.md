# 140: Steering host core (106-C1): runtime interface, dispatch policy, kill

**Type:** feature

**Priority:** P1

**Blocked by:** 139

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4: the bridge dispatches, tracks and stops agents.

Scope source: ADR 0016 (as amended in PR #157) and the split table in `.scratch/organism-infra/handoffs/106-architect.md`. Parent: 106.

## What to build

`runtime.mjs` interface plus a fake runtime; `host.mjs`: dispatch policy (one synchronous reservation, `max_concurrent_cells`, 8-session cap, usage gate), 409 for relay-hop roles on the route path, an internal `start()` entry not reachable from HTTP; kill with escalation (stdin close, grace, SIGTERM, grace, SIGKILL) and a shutdown handler; `policy.mjs` constants; `sessions.jsonl` (dir 0700, file 0600, replay validation, `bridge-restart-unverified`); `POST /agents` and `POST /agents/:id/stop` via the registry; snapshot `agents` and the `agent` change; `.gitignore`; a `risk-check` pattern for `.claude/**`. Fake runtime only; no real `claude`.

## Acceptance criteria

- [ ] A fake-runtime test dispatches, streams events and kills an agent.
- [ ] Relay-hop roles get 409 on `POST /agents`; `start()` is unreachable from HTTP.
- [ ] A concurrent-dispatch race test never exceeds the caps.
- [ ] Kill escalates to SIGKILL; shutdown stops every child.
- [ ] `sessions.jsonl` and its dir have modes 0600/0700; replay validates entries.

## Comments
