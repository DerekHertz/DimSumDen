# Agents run behind a wall with grants, the bridge performs every privileged action, and Bao coordinates and merges

**Status:** accepted (user, 2026-10-10, in chat: "ADR0021 looks good"; drafted the same day by a plain session from the agent-system grill, 33 questions answered by the user). It amends ADR 0016 (decision 6's push and PR deny for den-started agents, the ten-minute deny, who holds credentials), ADR 0019 (decision 8, one active feature; decision 9, the testbed) and ADR 0002 (what counts against `max_concurrent_cells`). Spec: `.scratch/agent-os/spec.md`.

**Context.** Den Loop v1 (den-v1/13, PR #214) lets the user start one agent on one ticket from the den. Its first passing live run showed the system is tight in the wrong place and loose in the wrong place:

- A one-line task needed seven approvals, six of them for the agent's own board calls.
- Nothing at the OS level stops a den-started agent writing outside its worktree or using the network. Its limits are permission prompts, four deny rules, an environment allowlist, a cap of two agents and a usage cutoff at 90%.
- The multi-role relay runs only as subagents inside a desktop session, which the den cannot see. The bridge relay of ADR 0016 is not built.

The user's aim: build anything from the den, with every agent its own session, permissions tied to the task, limits on the machine's resources, and governance, "a secure OS with agents". The threat to defend against is agent mistakes and hostile content an agent reads (the web, a dependency, a target repo's own files). A determined attacker on the user's machine is out of scope.

## Decisions

1. **The model.** The bridge is the kernel. An agent is a separate CLI session (a process). Its worktree is the only place it may write. A bridge route is a system call. Role ceilings and task grants are capabilities. Needs you is the prompt for rights beyond them.

2. **The wall.** An agent may read the project and do anything inside its own worktree without asking. Outside the worktree and on the network it is refused or asks. The wall is the CLI's built-in sandbox for filesystem and network, with a `systemd-run` scope for CPU and memory. A spike under the bridge's real spawn flags comes first and ends in a go or no-go; a container per agent is the fallback. Until the spike reports, nothing in this ADR claims the wall holds.

3. **Grants.** A role sets the most an agent of that role can ever do (its ceiling). A task adds named extras, shown to the user at Start. Beyond both, the agent asks in Needs you. Only `claude-adapter.mjs` turns a ceiling and grants into CLI flags or settings. ADR 0016 decision 6 holds: no client string reaches argv or the prompt template.

4. **Network.** None by default. A project names its hosts once (its package registry, its git host) and the user approves that list. A host not on the list asks the user. Only the scout reads the open web; it cannot write code, push or merge, and other agents receive its report as data.

5. **When the wall refuses.** The first refusal shows on the panda's card and in the transcript. After three refusals of the same kind the bridge pauses the agent and asks the user, with "grant for this task" offered. The bridge detects refusals from the stream; no model is involved.

6. **No consumption caps.** No per-agent or per-task cap on tokens, cost or wall time (the user: budgets "backfired"). Consumption is still recorded in the ledger and shown. Whether consumption can be estimated per task accurately is a later research question. The existing plan-level cutoff at 90% usage stays.

7. **Privileged actions go through the bridge.** Board writes (claim, comment, handoff, release), push, PR, merge and starting an agent are bridge calls. The bridge holds the only credentials and checks policy itself before acting. No agent, Bao included, holds git or GitHub credentials. Agents may push their branch and open a PR this way, which replaces the deny rule for den-started agents.

8. **Bao is the coordinator.** The existing orchestrator role, embodied as Bao at the Pass. It runs as short sessions woken by events (a ticket is ready, an agent finished, checks turned green), never as a standing session; state lives on the board. It may split an approved spec into tickets, start and stop agents within policy, and ask for a merge. It has no code-write access and never answers another agent's permission request.

9. **Merge.** The bridge merges on Bao's request only after checking the conditions itself: CI green, qa verify passed, and risk-check clean or security passed. In the target project that is enough. In this repo the merge is refused when the diff touches a guardrail path; those stay with the user.

10. **The user's gates.** Changes to the guardrails themselves (`.claude/`, role ceilings, bridge policy, the adapter, project host lists, the guardrail path list), anything published outside the machine other than a git push, and every request to cross the wall.

11. **Pipeline.** Slim by default: developer test-first, then a light qa verify, each its own session. Bao adds qa specify and security when risk-check hits or the ticket is marked risky. Jev is parked until the bridge relay exists; it then advises that escalation and decides no permission.

12. **Sessions.** At most two working agents at once, plus one reserved slot for Bao and one for a scout (four sessions at most), so a worker that needs a scout can never deadlock. No in-session subagents: a role that needs a scout asks the bridge. The cap is raised later from measurement.

13. **Presence.** The den has an Open/Closed switch, and the user is also treated as away after an idle limit (ten minutes to start, one editable value). When the user is away:
    - An agent waiting on a request writes a handoff and stops. The request is kept for the user's return. This replaces "ten minutes of silence is a deny" (ADR 0016). No pings are sent to keep a cache warm.
    - The freed slot goes to janitorial work: worktree and branch cleanup, board audit and triage drafts, doc fixes, flaky-test repair, and retro.
    - Retro and learning write proposals only (gated patches and tickets). They apply nothing.
    - Bao may merge a janitorial PR only when its diff touches docs and test files alone, with CI green and risk-check clean. Everything else waits.

14. **Projects.** The den works on one target project at a time, in its own directory, chosen when the bridge starts. This repo is the control plane: role files and settings live here and the target repo's own `.claude/` is not loaded. The board lives in the target repo. First target: `safety-aware-route-planner`; then `family-bingo`.

15. **Order.** (1) wall spike, (2) grants, (3) target project, (4) privileged actions through the bridge, (5) bridge relay, (6) Bao with merge, (7) presence and janitorial work, (8) retro proposals. Tickets are written for steps 1 to 3 only. Steps 4 to 8 are reordered and ticketed from what the target project shows.

## Proposed, not yet put to the user

- **Role ceilings.** scout: read the project and the web, no write. developer and qa: write in the worktree, the project's hosts. security: read, and write its report in the worktree. Bao: read the project and board, bridge calls only. designer, architect, product and herald: not worked out.
- **Guardrail paths in this repo.** `.claude/`, `apps/bridge/cells/policy.mjs`, `apps/bridge/cells/claude-adapter.mjs`, wherever ceilings and host lists are stored, `.github/workflows/`, and the path list itself.
- **UI.** Grants at Start, wall notices, the Open/Closed sign and Bao's body need a design session with mockups before any code.

## Task tree with a barrier (the user's idea; decided 2026-10-10 in a second round, questions 34 to 37)

16. **A large task is a tree, and the bridge holds its barrier.** A higher model cuts a large task into scopes small enough for the smallest model. A swarm of small-model agents takes one scope each. Each signals completion to its parent. The parent proceeds only when all its children are done, runs the risk checks and sends the result to Bao for evaluation.
    - **Barrier.** A bridge object: a parent ticket blocked by its child tickets. The bridge wakes the parent when the last child is done. No parent session waits.
    - **Swarm size (amends decision 12).** A separate lane of up to four small-model workers, alongside the two larger workers and the reserved slots. Raised later from measurement.
    - **Sign-off (amends decision 9 for trees).** The user approves the plan (the cut into scopes) before the swarm starts, and the feature PR at the end. In between, the bridge merges a child's branch into the parent's branch on green checks. Decision 9 still governs a ticket that was not cut into scopes, and decision 13 the janitorial PRs. *(That last sentence is the drafting session's reading, not a quoted answer.)*
    - **A child that fails or stalls.** One retry with a sharper brief, then a larger model takes that scope, then the user is asked. The barrier has a limit and never waits forever.
    - The slim pipeline of decision 11 is this tree with one child. Step 5 builds the relay with a barrier, starting at depth one.
    - Not known, to be measured on the target project: whether a higher model can cut scopes the smallest model finishes without bouncing; what each extra session costs to start (the three unfinished den runs used 23k to 26k tokens each); how children's branches are integrated without conflicts.

## Unknown until the spike

1. Whether the CLI sandbox starts under the bridge's spawn flags on WSL2.
2. Whether a write outside the worktree is blocked by the OS, not only prompted.
3. Whether the network is blocked except for named hosts.
4. Whether commands inside the wall run with no prompt.
5. Whether `systemd-run` memory and CPU limits apply to the agent and its children.
6. What the Read, Write and Edit tools do outside the worktree. The sandbox is believed to cover shell commands only, so these may still need permission rules.
7. Whether a sandbox refusal can be told apart from an ordinary failed command in the stream (decision 5 depends on it).

Also not known: how roles load when the agent's working directory is another repo (decision 14), and how long a bridge-run agent's prompt cache lives.

## Amendment 1 (accepted by the user 2026-10-10, question tool: "Go, accept the amendment"): what the wall spike found

The spike is agent-os/01. It ran the real CLI (2.1.293, Haiku) three times on WSL2 with the bridge's own argv and the wall on, in a worktree of a throwaway repository. The third run is recorded in `apps/bridge/cells/fixtures/wall.jsonl`, with the disk state the harness found in `wall-results.json`. `node apps/bridge/cells/conformance.mjs --spike Wall` runs it again.

**The settings that produced it.** The argv is the bridge's unchanged. The inline `--settings` value gains one block, built by `buildClaudeArgs({ wall: { hosts } })` in `claude-adapter.mjs`:

```json
"sandbox": {
  "enabled": true,
  "failIfUnavailable": true,
  "allowUnsandboxedCommands": false,
  "autoAllowBashIfSandboxed": true,
  "network": { "allowedDomains": ["example.com"], "strictAllowlist": true }
}
```

The production runtime does not pass `wall` yet. That is agent-os/02.

**Answers to the seven unknowns.**

1. **Does the sandbox start under the bridge's flags on WSL2? Yes.** `bwrap` and `socat` were enough. With `failIfUnavailable` on, the child started and its commands ran inside the sandbox.
2. **Is a write outside the worktree blocked by the OS? Yes, with one opening.** A shell write to the repository root and to the home directory failed with `Read-only file system` and no file appeared. The `dangerouslyDisableSandbox` parameter was passed and changed nothing. The opening: the main checkout's `.git` directory is writable from a worktree (the CLI allows it so that `git commit` works); a write to `.git/hooks` was refused, and the CLI's documentation says `.git/config` is refused too (not tried).
3. **Is the network blocked except for named hosts? Yes.** The listed host answered. The unlisted host was refused by the sandbox proxy with no request raised. A sandboxed command sees only the loopback interface, and a direct TCP connection failed with `Network is unreachable`.
4. **Do commands inside the wall run with no prompt? Mostly.** Twelve of thirteen sandboxed shell commands raised no request. One did (`curl` with a `-w '%{http_code}'` argument, "This command requires approval"): the CLI still asks about some command shapes, whatever the sandbox.
5. **Do `systemd-run` limits apply? Yes** (run later the same day, once the user had enabled linger; fixture `limits.jsonl`, spike `Limits`). The CLI was started as `systemd-run --user --scope -p MemoryMax=2G -p MemorySwapMax=0 -p OOMPolicy=continue -p CPUQuota=100% -- claude …`, with the wall on. A sandboxed command reported the scope as its own control group. A command that asked for 3 GB was killed (exit 137, `oom_kill` rose by one in the scope) and the agent went on to the next turn. Four busy loops for four seconds were throttled to about one core (4.5 s of CPU in a 6.9 s turn that asked for 16). Three things to know:
   - It needs a user service manager. This machine had none until `sudo loginctl enable-linger <user>` was run.
   - With systemd's default `OOMPolicy` (stop), the first run ended the whole scope, agent included, as soon as one command went over the memory limit. `OOMPolicy=continue` kills only the process the kernel picks.
   - `systemd-run --user` needs `XDG_RUNTIME_DIR` to find the user bus. The bridge's child environment does not carry it, so the launcher sets it for `systemd-run` and removes it again for the CLI.
6. **What do Read, Write and Edit do outside the worktree? They ask.** Each raised a request ("Path is outside allowed working directories"). They are not behind the sandbox: the one outside Write that the harness allowed was written. Inside the worktree, Read ran unasked and Write still raised a request.
7. **Can a refusal be told apart in the stream? Partly.** A refused host carries a `<sandbox_violations>` block and an `X-Proxy-Error: blocked-by-allowlist` header in the tool result. A refused write has no mark: it is an ordinary failed command whose text says `Read-only file system`. No separate line kind reports either.

**What this changes for the steps that follow.**

- The wall covers shell commands only. The file tools, hooks and MCP servers stay outside it. For the file tools, permission rules are the boundary, so decision 3's "refused outside the worktree" is "asked about" for Read, Write and Edit unless agent-os/02 adds deny rules.
- Decision 3's "free inside the worktree" needs an allow rule for Write and Edit in the worktree. The sandbox does not give it.
- Reads are open. A sandboxed command read a file in the repository root and one in the home directory, unasked. With any host on the list, a file the user can read could be sent there. agent-os/02 should try the CLI's read limits (`sandbox.filesystem.denyRead` with `allowRead`, or `permissions.blockReadsOutsideWorkingDirectories`) before a host is listed for an agent that handles hostile content.
- An agent can write to the main checkout's `.git` (a new file there was written; a file under `hooks` was refused). The bridge should not trust a branch in the main checkout that an agent could have moved.
- Decision 5 (notice, pause at three of a kind) can be built on the tool result text: the violations block for hosts, and `Read-only file system` for writes. The second is a text match and can be wrong.
- Decision 2's hardware limits work as a scope around the CLI. Where the `systemd-run` argv lives (it is not a Claude flag), the limit values per role, and whether an agent that goes over memory is stopped or only loses the command, are for agent-os/02.

## Consequences

- den-v1/14 (allowlist, then auto mode) is replaced by the wall spike. Auto mode is not adopted: inside the wall no decision is needed, and crossing it reaches the user, not a classifier.
- organism-infra/131 and 155 (sandbox design), 86 (merge on green), 153, 154, 163, 216, 133 and den-scene-v1/13 are covered by this ADR's steps and close as superseded when their step is ticketed.
- 29 tickets of tooling for the desktop relay were parked on 2026-10-10.
- Role files lose the in-session scout. That is a change under `.claude/` and ships as a gated patch for the user.
- The bridge gains the only write path to git remotes. Its own checks (decision 9) become the most security-sensitive code in the repo and need the full relay with security review.
