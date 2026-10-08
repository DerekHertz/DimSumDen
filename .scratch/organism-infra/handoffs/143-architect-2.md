# 143 architect handoff 2: ADR 0016 amendment 6 (fix round after security bounce)

Branch `docs/143-adr0016-spike-verdicts`, commit 921f02c on top of f238c09. Doc and board only; no code, no tests run.

## What changed in `docs/adr/0016-ui-steering-channel.md`

- **S4b is `unconfirmed`, not `go`.** Round 3 bullet rewritten: the tool never ran (CLI refused `tail -f` outside cwd; evaluator matched the child's own argv). The old text is kept as "withdrawn". Decision 2's kill row and "Process lifetime" now say the child is a process-group leader (`detached: true`) with group SIGTERM/SIGKILL; only a valid S4b re-run may remove it, by a further amendment. "What 143 builds" matches. The re-run fix (hold file in cwd, marker not in argv, `tool_use` without `permission_denied`, ppid chain) is written into the bullet.
- **Decision 6.3 amended.** S8 outcome (c) accepted by the user with security's conditions: claim is "not shown to answer a permission request with the one shape tried", second-shape probe is a gate on any later widening, the paragraph is the "written into this item" record, and the `command_lifecycle` detection idea is noted for 143 (untested, needs an idle-injection probe first).
- S6b accepted as setup-invalid (6.10 stays partial, deny-over-allow untested); background-task EOF finding and 0600/0700 evidence accepted. Header gains amendment (6); the Consequences line about waiting on re-runs is updated.

## Board

- New ticket `organism-infra/202-conformance-spikes-round-4-fixes` (ready-for-agent, P1): S4b hold file and pid matcher, `evaluateS8` polling plus second `control_response` shape, S6b control check, socket dir owner and group bits, setup-guard breadth (absent init, plugins, hooks).
- 143's `Blocked by` now `141, 142, 195, 202`. Both edits are in this branch's worktree copy of `.scratch/` (the Write guard refused the main-checkout path); they reach the board when the branch merges, and the main-checkout 143 file differs from the branch copy only in Status and the security comment, so the merge should be clean once the orchestrator commits main's board state. The orchestrator may prefer to copy the ticket and the Blocked by line into the main checkout directly.

## Decision for the orchestrator

143 is now blocked by 202, per the user's instruction, although the ADR makes 143 buildable with the defensive group kill. If the user would rather not wait for 202, drop 202 from 143's Blocked by; nothing else depends on it.

## State

```json
{
  "ticket": "organism-infra/143-steering-adapter-process",
  "cell": "architect",
  "current_step": "ADR 0016 amendment 6 committed (921f02c): S4b unconfirmed with detached group kill kept, S8 (c) accepted with conditions in 6.3, S6b setup-invalid; ticket 202 filed and added to 143 Blocked by",
  "artifacts": ["docs/adr/0016-ui-steering-channel.md", ".scratch/organism-infra/issues/202-conformance-spikes-round-4-fixes.md", ".scratch/organism-infra/issues/143-steering-adapter-process.md"],
  "decisions": ["S4b back to unconfirmed; 143 keeps detached process-group kill until a valid re-run", "S8 (c) residual accepted with security conditions (a) to (c); 6.3 wording amended", "S6b accepted as setup-invalid, EOF finding accepted", "Spikes follow-up filed as ticket 202 and blocks 143"],
  "failures": [],
  "pending": [
    {"item": "Open the PR for docs/143-adr0016-spike-verdicts and merge on green; commit main board state (143 Blocked by, ticket 202) without conflict", "owner": "orchestrator"},
    {"item": "Ticket 202: fix conformance.mjs per its criteria, user re-runs, architect records the S4b verdict", "owner": "developer"},
    {"item": "143 qa specify once 202 is resolved (or the user drops it from Blocked by)", "owner": "qa"}
  ]
}
```
