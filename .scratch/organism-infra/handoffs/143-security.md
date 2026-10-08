# 143 security handoff: re-review of ADR 0016 spike round 3 verdicts (f238c09)

Verdict: **Security bounce** on the ADR's S4b verdict (one high); S8 (c), the evaluator miss, the 0600/0700 evidence, S6b and the 195 low are acceptable with conditions below. Doc-only branch; no secrets or dependency scope reviewed beyond the diff (one ADR file).

## Findings

1. **HIGH, docs/adr/0016-ui-steering-channel.md (round 3 bullet "S4b is go, plain"): the S4b evidence is invalid; the tool call never ran.** In all six S4b fixtures (S4b-eof/term/kill and the three control runs) the `tail -f` call was refused by the CLI: a `system/permission_denied` event and an `is_error` tool_result saying "tail in '<hold file>' was blocked ... may only read the end of files from the allowed working directories" (the hold file is under /tmp/den-s4b-*, outside the child's cwd). The ADR's "In the valid run the tool process was in flight" is false. Why the evaluator said go: `--allowedTools "Bash(tail -f <hold>)"` puts the hold path in the claude child's own argv, so `toolPids(hold)` (conformance.mjs:929, `ps` substring match) matches the child itself; the "tool really running" wait (runS4b `begin`, line ~975) passes on the child, and "0 survivors" is only the child having exited. Also the term fixture had already ended its turn (`result/success`) before SIGTERM. Third round in a row S4b has not put a tool in flight (round 2: `sleep 61` refused). Consequence: "child only, no process group" is unproven, and a stop button that leaves a Bash grandchild (dev server, npm test) running is a real failure of the kill guarantee. Required: the ADR must say S4b is unconfirmed, not go; 143 keeps the defensive design (child as process-group leader via `detached: true`, group SIGTERM/SIGKILL after the bounded grace) until a valid re-run shows otherwise. Re-run fix for the spikes' owner: put the hold file inside the child's cwd (or use a command the CLI does not block), match the tool process by a marker that is not in the child's argv (for example a unique `sleep` duration or a script name passed only in the prompt), and require a `tool_use` with no `permission_denied` plus a tool pid whose ppid chain is not the child.
2. **MEDIUM, S8 outcome (c) injection residual: acceptable to record, with conditions.** Fixture S8.jsonl lines 8 to 13 and S8-control: the queued peer message reached the model after the sleep 15 call. Threat: every cell child runs as the same uid and has Bash, so a prompt-injected cell can enumerate /tmp/cc-socks/*.sock and write into a sibling cell's session (cross-cell lateral movement, not new host compromise). The approval hold still binds for the shape tried; effect is bounded by the target cell's auto-allowed tools. The model replied it had "nothing to act on", which is model behaviour, not a control. Conditions: (a) say "not shown to answer a permission request with the one shape tried" in decision 6.3, not "cannot"; outcome (d) is not ruled out for good (the ADR already lists the second-shape follow-up; keep it as a gate for any later widening, not just a follow-up); (b) decision 6.3 itself still says the claim is withdrawn and requires the (c) residual to be "written into this item": amend 6.3 when the user accepts; (c) cheap detection to consider in 143 (not tested): in the fixture the injected message shows on stdout as `command_lifecycle` (started/completed) with a command_uuid; in slice 1 the host sends no mid-turn messages, so an unexpected `command_lifecycle` is a signal to surface (and could be a deny-all trigger). Needs a probe for an injection while idle before relying on it.
3. **LOW, evaluator miss (evaluateS8, conformance.mjs ~316-323):** confirmed by fixtures; the 2 s window misses queued messages. Interrupt "no effect" holds (tool result carries no `interrupted`). Follow-up as the architect listed.
4. **LOW, 0600/0700 evidence (conformance.mjs:801-806, 291):** both runs show socket 0600 uid 1000, dir 0700, same uid. The check tests only the "others" bits (0o007), not group bits (0o070), and does not record the directory's owner uid, so a pre-created /tmp/cc-socks owned by another user would pass. Single-user WSL: low. Record dir uid and group bits in the next spike pass.
5. **LOW, S6b: agree setup-invalid.** Fixtures S6b and S6b-control: both Write calls refused "you haven't granted it yet", `permission_denied`, so the allow never applied with or without `--settings`; deny-over-allow is untested. Note this is the security-relevant precedence (the `.claude/**` deny must outrank any allow): 6.10 stays a partial measure and must not be described as verified. Fails safe (more prompts).
6. **LOW, background-task EOF finding (round 2):** accept; SIGTERM step mandatory. It also means finding 1 matters more: a child with a background task survives EOF.
7. **LOW, 195 open low (absent init skipped by setupProblems; guard checks only permissionMode and mcp_servers):** still open. The fixtures also show `plugins` (three builtin) and a `hook_started` in S6b that the guard does not inspect. No change in severity; keep as a spikes-ticket item.

## For the user to accept or reject before 143's qa specify

- Accept S8 (c) residual: yes with conditions 2(a) to (c).
- Reject the S4b go/plain verdict; require the defensive group-kill design in 143 (or a valid re-run first).
- Accept the S6b setup-invalid call and the background-task EOF finding.

## State

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "security",
  "current_step": "Re-review of ADR 0016 round 3 verdicts done: security bounce on S4b (invalid evidence, tool never ran); S8 (c), S6b, 0600/0700, EOF finding acceptable with conditions; 143 not implemented",
  "artifacts": ["docs/adr/0016-ui-steering-channel.md", ".scratch/organism-infra/artifacts/106-conformance-2026-10-09/"],
  "decisions": ["S4b go/plain not supported: all six fixtures show the tail -f call blocked by the CLI; evaluator matched the child's own argv", "S8 outcome (c) acceptable to record with conditions", "S6b setup-invalid agreed"],
  "failures": [],
  "pending": [
    {"item": "Architect: amend ADR round 3 bullet so S4b is unconfirmed and 143 keeps detached group kill; amend 6.3 with the accepted (c) residual wording; user accepts/rejects", "owner": "architect"},
    {"item": "Spikes ticket: fix S4b (hold file in cwd, marker not in argv, assert tool_use not blocked), evaluateS8 polling, S6b control check, socket dir uid and group bits, init guard breadth", "owner": "developer"}
  ]
}
```
