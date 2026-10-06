# 140: Steering host core (106-C1): runtime interface, dispatch policy, kill

**Type:** feature

**Priority:** P1

**Blocked by:** 139

**Status:** in-review

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
- **orchestrator, 2026-10-06:** User 2026-10-06: herald SHOULD be dispatchable from the UI ("interact with every agent"). Before the developer starts: flip the herald 409 to allowed on tests/140-steering-host-core (one line + one test, per 140-architect handoff) and amend ADR 0016 decision 3 to match. The architect wrongly released 140 as in-review; reset it to ready-for-agent before the developer claim. Tests head: c2d959c (not pushed). Follow-ups filed as 153 (audit line, worktree per agent, prompt template) and 154 (UI dispatch beyond one agent).
- **orchestrator, 2026-10-06:** Kernel note (140-architect-2.md) decisions, user 2026-10-06: host does not own worktree/lock allocation (ADR 0011 stands); cell sandboxing filed as 155 (parked until den-v1); Grep tool outage filed as 156; repeat same-cell handoffs use the -N suffix. Minimality is a review test for the host, no package split. Next steps (orchestrator, 5h at 91%, wrapped up): developer done at db9fc50 on feat/140-steering-host-core (local, not pushed), self-review only after a context overrun. Next: qa verify (light; qa specified) detached at db9fc50 with a /code-review pass to cover the gap, then risk-check (expected hit: spawn/process handlers) -> security, then PR. At merge the user approves ADR 0016's fourth and herald amendments, plus REF_RE \d{2,} vs the ADR's \d{2} (developer handoff).
- **orchestrator, 2026-10-06 (WSL):** qa verify is waiting on the MacBook: `tests/140-steering-host-core` (d92cf29) and `feat/140-steering-host-core` (db9fc50) were never pushed, and the user does not have the MacBook today. Push both from the MacBook, then dispatch light verify per handoff 45. 158 prevents a repeat.
