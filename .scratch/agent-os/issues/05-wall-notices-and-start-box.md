# 05: Wall notices, the pause at three and the Start box grants table

**Type:** feature

**Priority:** P1

**Blocked by:** agent-os/07

**Status:** ready-for-agent

**Serves:** agent-os step 2, third PR (ADR 0021 decisions 2 to 5). User stories 3 to 5. It is the refusal and UI half of agent-os/02, split out at the user's choice on 2026-10-11 after qa specify on 02 returned partial with only the backend half specified.

## What to build

The user sees a task's grants before it starts, sees when the wall refuses an agent, and can grant or keep refusing after three refusals of one kind. This is a UI ticket. The UI spec is signed off: `.scratch/agent-os/handoffs/02-designer-spec.md` (mockup linked in agent-os/02's comments). It needs no new designer session unless the spec has to change.

- **Start box.** The Start box shows a task's grants before the agent runs: the two-sided wall table and the folded card from the designer spec. Add, refuse and remove work there. `startTask` receives grants in the fixed shape agent-os/02 validates. A 400 from `POST /tasks` keeps the text and the grants.
- **Refusal marks.** The bridge marks a wall refusal on the agent row (card and transcript notice). A refused host carries a `<sandbox_violations>` block in the tool result; a refused write is only the text `Read-only file system`, so the write match can be wrong (agent-os/01, question 7 answered "partly"). A file-tool request outside the worktree gets no wall mark.
- **The pause at three.** After three refusals of the same kind the bridge pauses the agent and raises a request in Needs you listing the three targets, offering "Keep refused" and "Grant for this task" through `POST /approvals/:id`. Keep refused restarts the count.

The seams qa named for these tests are in `.scratch/agent-os/handoffs/02-qa-specify.md`, under `pending`.

## Acceptance criteria

- [ ] Failing tests first: the fake runtime's refused-host and refused-write events mark the agent row, by kind, with a transcript notice.
- [ ] The pause at three has tests against the stub: the state, the request in Needs you, Keep refused and Grant for this task, and the count restarting.
- [ ] The Start box lists the task's grants (UI test), per the signed-off designer spec's criteria map.
- [ ] The user has critiqued the build and said yes.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Comments

- 2026-10-11, orchestrator: split from agent-os/02 (user, 2026-10-11). agent-os/02 keeps the adapter, the governance deny list, host checks, the read limit and `POST /tasks` grants.
- 2026-10-11, orchestrator: agent-os/02 resolved (PR #222). Now blocked by agent-os/07 (grant hardening), so the security findings land before a grants table exists in the UI (user, 2026-10-11).
