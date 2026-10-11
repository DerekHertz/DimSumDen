# 06: Hardware limits around the agent CLI

**Type:** feature

**Priority:** P2

**Blocked by:** agent-os/02

**Status:** needs-triage

**Serves:** agent-os step 2 (ADR 0021). Split out of agent-os/02 at the user's choice on 2026-10-11, after 02's developer returned partial with this part not started.

## What to build

A task's agent runs under hardware limits, so a runaway agent can't take the machine down. agent-os/01 showed the limits work as a `systemd-run --user --scope` around the CLI (needs linger, `XDG_RUNTIME_DIR` for the launcher only, and `OOMPolicy=continue` unless a memory kill should end the agent).

Open decisions, to settle before a build (architect, then the user):
- Where the `systemd-run` argv lives (the adapter, the runtime, or a launcher).
- The limit values per role.
- Whether a memory kill stops the agent or lets it continue.

## Acceptance criteria

- [ ] The three decisions above are recorded on this ticket, with the user's yes.
- [ ] Failing tests first: the spawn argv carries the limits for each role, per the decisions.
- [ ] Live check: an agent that exceeds its memory limit behaves as decided, and the bridge reports it.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Comments

- 2026-10-11, orchestrator: split from agent-os/02 (user, 2026-10-11). The text above is 02's hardware-limits bullet; the decisions are open, so the status is `needs-triage`.
