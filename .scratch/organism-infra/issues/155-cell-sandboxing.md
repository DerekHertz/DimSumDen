# 155: Treat spawned cells as untrusted: separate OS user or sandbox

**Type:** design-question

**Priority:** P3

**Blocked by:** none

**Status:** parked

**Serves:** The steering host can enforce limits against the cells it spawns, instead of only structuring them.

Source: kernel note in `.scratch/organism-infra/handoffs/140-architect-2.md`. Cells run as the user's OS account, so the host cannot enforce bindings against them; a kernel framing is structure only. User decision 2026-10-06: file it and park it until den-v1 ships. Route: architect first, then security.

## What to build

A decision (ADR) on whether and how cells spawned by the steering host run untrusted: a separate OS user, a sandbox, or neither, and what the host then enforces (worktree, network, credentials, `.claude/`).

## Acceptance criteria

- [ ] An ADR records the choice and its costs on macOS and WSL.
- [ ] Follow-up build tickets are filed, or the ADR records why none are needed.

## Comments
- **orchestrator, 2026-10-06:** Parked: user 2026-10-06: after den-v1 ships
