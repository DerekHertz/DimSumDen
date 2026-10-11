# agent-os: agents behind a wall, the bridge as kernel, Bao as coordinator

Status: ready-for-agent (spec, approved by the user 2026-10-10; tickets published as agent-os 01-03). Source: the agent-system grill, 2026-10-10. Decisions: ADR 0021 (accepted).

## Problem Statement

I can start one agent on one ticket from the den, and it asks me seven times to finish a one-line task. Yet nothing but those prompts stops it writing anywhere on my machine or calling any host. Work that needs several roles still runs inside a desktop session the den cannot see. I want to build anything from the den, on other projects, with agents that are free where it is safe and stopped where it is not.

## Solution

Each agent is its own session behind a wall: free inside its worktree, refused or asking outside it and on the network. What an agent may do comes from its role's ceiling plus grants on the task. Everything privileged (board writes, push, PR, merge, starting agents) is a call to the bridge, which holds the only credentials and checks policy itself. Bao, the orchestrator, coordinates in short event-woken sessions and may merge. When I am away, waiting agents hand off and stop, and only low-risk janitorial work runs.

## User Stories

1. As the user, I start a task and the agent works inside its worktree without asking me anything.
2. As the user, when an agent tries to write outside its worktree, the OS refuses it, and I see that on its panda.
3. As the user, I see a task's grants (hosts, extra paths) at Start, before the agent runs.
4. As the user, when an agent needs a host that is not on the project's list, it asks me in Needs you.
5. As the user, after three wall refusals of the same kind the agent is paused and I am asked, with a one-task grant offered.
6. As the user, I point the den at another repo and its agents use the roles kept in this repo, never that repo's own `.claude/`.
7. As the user, an agent's board calls raise no prompt, because the bridge makes them.
8. As the user, an agent can have its branch pushed and a PR opened without holding any credential.
9. As the user, I see a developer and then a qa agent work one ticket as two pandas, each its own session.
10. As the user, Bao splits a spec I approved into tickets and starts agents on them, within the cap.
11. As the user, Bao's merge happens only when the bridge's own check of CI, qa and risk-check passes.
12. As the user, a merge that touches a guardrail path in this repo always waits for me.
13. As the user, I flip the den to Closed, or go idle, and waiting agents hand off and stop with their requests kept.
14. As the user, while I am away only janitorial work runs, and only PRs touching docs and test files alone may merge.
15. As the user, retro leaves me proposals to approve and has changed nothing.
16. As the user, I see what every run consumed, with no cap cutting an agent off mid-task.
17. As the user, I approve how a large task is cut into scopes before a swarm of small-model agents starts on them.
18. As the user, I see a parent wait at its barrier until every child has signalled, and I am asked when a child has failed its retry and its escalation.
19. As the user, I sign off the feature PR at the end of a task tree.

## Implementation Decisions

- ADR 0021 decisions 1 to 15 are the contract. ADR 0016 decision 6 still holds: no client string reaches argv or the prompt template, and only `claude-adapter.mjs` names a Claude flag, setting or message shape.
- Ceilings and project host lists are data in this repo, read by the bridge and compiled by the adapter. They are guardrail paths.
- Any change under `.claude/` ships as a gated patch for the user.
- Each step lands as its own ticket and PR, failing test first, against the fake runtime or the claude stub, with a recorded live check where the real CLI's behaviour is the question (as den-v1/13 S3 did).

### Steps

| # | Step | Done when |
|---|---|---|
| 1 | Wall spike | The seven unknowns in ADR 0021 are answered with recorded fixtures, and there is a go or no-go |
| 2 | Grants | A den-started agent in this repo runs a task inside its worktree with no prompt; a write outside is refused; ceilings and grants have adapter tests |
| 3 | Target project | One task runs on `safety-aware-route-planner` from the den, with roles from this repo and the board in the target |
| 4 | Privileged actions | Board calls, push and PR go through the bridge; the agent's environment holds no credential |
| 5 | Bridge relay with a barrier | Developer then qa verify run as bridge sessions on one ticket; then one parent with several children, the bridge waking the parent when all are done (ADR 0021 decision 16) |
| 6 | Bao with merge | Bao's sessions are woken by events; the bridge merges only on its own check |
| 7 | Presence and janitorial | Open/Closed and idle hand-off work; the janitorial queue runs |
| 8 | Retro proposals | Retro writes gated patches and tickets only |

Tickets are written for steps 1 to 3 once this spec is approved. Steps 4 to 8 are reordered and ticketed from what the target project shows.

## Testing Decisions

- The wall is tested by trying to break it: a write outside the worktree, a call to an unlisted host, a memory limit exceeded. A test that only checks the settings were passed proves nothing about the wall.
- The bridge's merge check is tested with each condition failing in turn, and with a guardrail path in the diff.
- No test asserts a consumption cap.

## Out of Scope

- Defence against a determined attacker on the machine.
- Caps on tokens, cost or wall time, and the estimation research.
- Several target projects at once.
- Auto mode and any classifier deciding a permission.
- Jev changes, until the bridge relay exists.
- Den art: desks, pandas idling at stations, walk speed. They wait for a design session and for target-project friction.

## Further Notes

- Not yet decided with the user: the ceilings for designer, architect, product and herald; the exact guardrail path list; the UI for grants, wall notices, the Open/Closed sign and Bao's body.
- Not known: how roles load when the agent's working directory is another repo; how long a bridge-run agent's prompt cache lives.
- The existing 90% usage cutoff and the 8-session ceiling stay.
