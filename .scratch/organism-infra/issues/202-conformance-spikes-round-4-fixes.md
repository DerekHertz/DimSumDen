# 202: Conformance spikes: valid S4b re-run, S8 polling, S6b control check, socket dir checks, wider setup guard

**Type:** task

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4. The S4b, S8 and S6b verdicts that 143 (106-D2) builds on; 143 keeps its detached process-group kill until a valid S4b re-run says otherwise.

Scope source: ADR 0016 (amendment 6, "Spike round 3 verdicts") and `.scratch/organism-infra/handoffs/143-security.md` (findings 1, 3, 4, 5, 7). Parent: 106. Earlier tooling: 138, 195.

## What to build

Fix `apps/bridge/cells/conformance.mjs` so the next user run gives valid S4b, S8 and S6b verdicts. The round 3 run (2026-10-09 fixtures in `.scratch/organism-infra/artifacts/106-conformance-2026-10-09/`) was setup-valid but still did not measure what the spikes claim.

1. **S4b hold file and pid matcher (security finding 1, high).** In all six S4b fixtures the `tail -f <hold>` call was refused by the CLI (`permission_denied`) because the hold file sat under `/tmp/den-s4b-*`, outside the child's cwd. `--allowedTools "Bash(tail -f <hold>)"` also put the hold path in the child's own argv, so `toolPids(hold)` (`ps` substring match, ~line 929) matched the child and the "tool really running" wait passed on it. Fix: put the hold file inside the child's cwd (or use a command the CLI does not block); match the tool process by a marker that is not in the child's argv (a unique `sleep` duration, or a script name given only in the prompt); require a `tool_use` with no `permission_denied`, and a tool pid whose ppid chain does not run through the child. If the tool is not shown in flight, report S4b `setup-invalid`, never go or no-go. For the SIGTERM run, check the turn has not already ended (`result`) before the signal.
2. **`evaluateS8` polling (finding 3, ~lines 316-323).** The CLI queues a peer message until the running tool call ends, so the 2 s window misses it. Poll for the nonce until the turn's `result` (bounded), and report outcome (c) when it arrives late. Keep the interrupt "no effect" check (the tool result carries no `interrupted`). Add a second `control_response` shape probe over the socket (ADR 0016 decision 6.3 condition (a)), reported separately.
3. **S6b control check (finding 5).** When the control run's `allowed.txt` is also absent, report S6b `setup-invalid` naming "project allow did not apply in the control", and save the child's stderr. As a comparison try an absolute-path or `//path` allow and the main checkout as the cwd. Deny-over-allow for the `.claude/**` deny stays untested until the control's allow applies; do not word any result as verifying decision 6.10.
4. **Socket directory owner and group (finding 4, ~lines 291, 801-806).** Record the `/tmp/cc-socks` directory's owner uid and check it equals the current uid; check group bits (`0o070`) as well as others (`0o007`) on both the directory and the socket.
5. **Setup-guard breadth (finding 7, 195's open low; ~lines 728-738).** An absent `init` is `setup-invalid`, not skipped. Also inspect and record `plugins` and any `hook_started` event (S6b showed a hook); report them as `setup-invalid` unless they are the known builtin set, naming the field.
6. Tell the user exactly how to run it and where to copy the output (as 195 did). The user runs it, then an architect records the verdicts in ADR 0016.

## Acceptance criteria

- [ ] A stub-child test: the S4b tool call refused with `permission_denied`, or a tool pid that is the child itself (hold path in its argv), makes S4b report `setup-invalid`, not go.
- [ ] S4b's hold file is inside the child's cwd (or the command is unblocked), and the matcher key is absent from the child's argv (tested).
- [ ] S4b passes only with a `tool_use`, no `permission_denied`, and a tool pid whose ppid chain does not include the child (tested with a stub).
- [ ] `evaluateS8` finds a nonce that arrives after the tool result and before `result` (tested with a delayed stub), and still reports no effect for interrupts.
- [ ] A second socket `control_response` shape is probed and reported separately from the first.
- [ ] S6b reports `setup-invalid` ("project allow did not apply in the control") when the control's `allowed.txt` is absent, with stderr saved (tested).
- [ ] The socket directory's owner uid is recorded and must equal the current uid; group bits are checked on the directory and the socket (tested with a fake stat).
- [ ] An absent `init`, an unknown `plugins` entry, or a `hook_started` event makes the run `setup-invalid` naming the field (tested).
- [ ] The run instructions in the ticket handoff fit on one screen.

## Comments
- **architect, 2026-10-08:** Filed from the security bounce on ADR 0016 round 3 (`143-security.md`) and the user's ruling. 143's Blocked by lists this ticket; 143 keeps the detached process-group kill until the S4b re-run is valid.
- **orchestrator, 2026-10-08:** User 2026-10-08: spikes are capped at this round. If round 4 leaves S4b or S8 inconclusive, ADR 0016 keeps its safe choices (detached group kill; no unattended widening) permanently and no round 5 is filed. No longer blocks 143.
- **orchestrator, 2026-10-08:** User confirmed qa's two readings: (1) S4b's "ppid chain does not include the child" means the matched pid is never the child itself (a real tool always runs under the child); (2) S6b is excluded from the `hook_started` guard because the worktree's own SessionStart hooks would always trip it. Developer builds to the tests at 3c3c1fc as written.
