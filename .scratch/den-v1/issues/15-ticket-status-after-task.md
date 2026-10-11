# 15: A den task's ticket stays ready-for-agent after the task ends

**Type:** bug

**Priority:** P2

**Blocked by:** den-v1/13 (merge of PR #214)

**Status:** ready-for-agent

**Serves:** Den loop v1. After a task ends the den should not ask the user to start it again.

## What happens

Seen while recording the den loop GIF (den-v1/13, 2026-10-10), against the stub agent:

1. Start a task for the scout from the den. The bridge writes the task's ticket with status `ready-for-agent`.
2. The agent runs, the user allows its request, the agent replies and its turn ends.
3. The ticket's status is still `ready-for-agent`.
4. Needs you then opens on a dispatch gate for that ticket, and the tally table shows it as "Queued".

So a finished task looks like work waiting to be started.

## What to decide, then build

- Which status a den task's ticket takes when the agent's turn ends, when it fails, and when it is cancelled. Who writes it: the bridge (it owns the agent) or the agent through the board CLI.
- Needs you and the tally table must not show a ticket whose den task has ended as waiting for dispatch.

Not yet looked at: whether the same happens with the real CLI, where the role's own protocol may move the ticket. Check that first; it decides whether the bridge has to write the status at all.

## Acceptance criteria

- [ ] A note here says what the real CLI run leaves as the ticket's status, with the recorded stream or the ticket file as evidence.
- [ ] Failing test first: after a den task's turn ends against the stub, the ticket is not `ready-for-agent`, Needs you has no dispatch gate for it, and the tally table does not say "Queued".
- [ ] The same for a failed task and a cancelled task.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Comments

- 2026-10-10, plain session (Opus 5.5): filed from the note on den-v1/13. Not started. The GIF in the README folds Needs you at the end to keep this out of the recording.
