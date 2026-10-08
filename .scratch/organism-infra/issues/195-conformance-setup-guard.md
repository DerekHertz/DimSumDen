# 195: Conformance spikes: refuse an invalid setup, fix the S4b and S6b probes

**Type:** task

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** in-review

**Serves:** Den loop steps 3-4. The S8, S4b and S6b verdicts that 143 (106-D2) builds on.

Scope source: ADR 0016 (spike round 2 verdicts, PR #185) and `.scratch/organism-infra/handoffs/142-architect.md` (pending items). Parent: 106. Earlier tooling: 138.

## What to build

The user's round-2 run (2026-10-08, artifacts in `.scratch/organism-infra/artifacts/106-conformance-2026-10-08/`) was setup-invalid for all four spikes, and ADR 0016 records why:

- The child ran in `permissionMode` auto, so no permission prompt was raised.
- User-scope MCP servers were loaded.
- The S4b in-flight tool was a `sleep` that a foreground-sleep guard refused. The guard text is not in this repo, so it is probably a user-scope hook in `~/.claude`.
- The S6b deny target sat under `.claude/`, which the CLI's built-in safetyCheck refuses anyway.

Fix `apps/bridge/cells/conformance.mjs` so that a re-run gives a valid verdict:

1. **Setup guard.** Before scoring any spike, read the child's `init` event. Unless `permissionMode` is `default` and `mcp_servers` is empty, report the run as `setup-invalid` and name the field that failed. Never report it as go, no-go or unconfirmed.
2. **S4b.** Use an in-flight tool call that the child really starts and that no guard refuses, so EOF, SIGTERM and SIGKILL are each measured while a tool process is running.
3. **S6b.** Put the deny target outside `.claude/`, so the result shows our deny rule and not the CLI's safetyCheck.
4. **Control run.** Add a run without `--settings`, so each spike can be compared with the CLI's own behaviour.
5. Tell the user exactly how to run it and where to copy the output. The user runs it, then an architect records the verdicts in ADR 0016.

## Acceptance criteria

- [ ] A fake `init` with `permissionMode` other than `default`, or with any `mcp_servers`, makes every spike report `setup-invalid` and name the field (tested with a stub child).
- [ ] S4b's in-flight tool is a process the stub test can see running when the kill lands, and it is not a `sleep` command.
- [ ] S6b's deny target is outside `.claude/` (tested).
- [ ] A control run without `--settings` is produced and scored next to each spike.
- [ ] The run instructions in the ticket handoff fit on one screen, and the user can copy-paste them from the main checkout.

## Comments
- **orchestrator, 2026-10-08:** Filed on the user's yes. 143 waits on the re-run this enables. The 6.3 verdicts still need a security re-review and the user's acceptance after the re-run (142-architect.md pending).
