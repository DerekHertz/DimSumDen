# 02: Grants: role ceilings and task grants for den-started agents

**Type:** feature

**Priority:** P1

**Blocked by:** agent-os/01 (a go)

**Status:** ready-for-agent

**Serves:** agent-os step 2 (ADR 0021 decisions 2 to 5). User stories 1 to 5.

## What to build

A den-started agent in this repo works inside its worktree with no prompt, and is refused outside it.

- **Ceilings.** One data file in this repo gives each role its ceiling. Start with scout (read the project and the web, no write), developer and qa (write in the worktree, the project's hosts) and security (read, and write its report in the worktree). It is a guardrail path.
- **Task grants.** A task may carry named extras (a host, an extra path). `POST /tasks` validates them against a fixed shape; the Start box shows them before the agent runs. No grant text reaches argv or the prompt template.
- **Compilation.** `claude-adapter.mjs` turns ceiling plus grants into the sandbox settings and permission rules that agent-os/01 recorded. The four deny rules stay.
- **Refusals.** The bridge marks a wall refusal on the agent row (card and transcript notice). After three of the same kind it pauses the agent and raises a request in Needs you offering "grant for this task". Build this only if agent-os/01 answered question 7 with yes; otherwise write down what replaces it.

## From the spike (agent-os/01, ADR 0021 amendment 1)

The spike was a go for the CLI sandbox around shell commands. It adds these to this ticket:

- **The file tools are not behind the wall.** Read, Write and Edit outside the worktree raise a request, and one that is allowed goes through. Permission rules are their boundary: allow Write and Edit in the worktree (today Write there still asks), and keep the ask, or add a deny, outside it.
- **Reads are open.** A sandboxed command read a file in the home directory unasked. Try a read limit (`sandbox.filesystem.denyRead` with `allowRead`, or `permissions.blockReadsOutsideWorkingDirectories`) with a live check, before any host is listed for a role.
- **Refusals.** Question 7 was "partly": a refused host carries a `<sandbox_violations>` block in the tool result; a refused write is only the text `Read-only file system`. The notice and the pause at three are built on that text, and the write match can be wrong.
- **The main checkout's `.git` is writable from a worktree.** The bridge should not trust a branch in the main checkout that an agent could have moved.
- **Some command shapes still ask** inside the wall ("This command requires approval"). Those requests reach Needs you as they do today.
- `buildClaudeArgs` already takes `wall: { hosts }`. This ticket makes the runtime pass it.
- **Hardware limits work** as a `systemd-run --user --scope` around the CLI (needs linger, `XDG_RUNTIME_DIR` for the launcher only, and `OOMPolicy=continue` unless a memory kill should end the agent). Decide where that argv lives, the values per role, and stop-or-continue on a memory kill.

From the security review of the spike (pass, 2026-10-10; findings in agent-os/01's comments):

- **Host names only.** `isWall` in `claude-adapter.mjs` accepts IP literals and internal names (`127.0.0.1`, `169.254.169.254`, `10.0.0.5`, `localhost.localdomain`). Reject IPs, `localhost.*` and private or link-local names before any grant reaches `wall.hosts`, and reject sparse arrays. Whether the CLI honours an IP in `allowedDomains` was not tried.
- **A read limit comes before any host.** With reads open, an agent that is given a host could send out what it can read, the CLI's own credentials included. No host is listed for an agent until the read limit is tried and holds.
- **Deny rules under the wall.** `autoAllowBashIfSandboxed` was not tried against the `git push` and `gh pr create` deny rules. Test that they still refuse with the wall on.
- **`.git/config`** in the main checkout was not probed; only `hooks` was.

## Acceptance criteria

- [ ] Failing tests first: the adapter compiles each role's ceiling, and ceiling plus a grant, into the recorded settings.
- [ ] A live check: a den-started developer task writes and runs tests inside its worktree with no permission request, and a write outside the worktree is refused.
- [ ] A grant outside the fixed shape is a 400, and a test shows no grant string in argv or the prompt.
- [ ] The Start box lists the task's grants (UI test). The layout is agreed with the user first.
- [ ] The refusal notice and the pause at three have tests against the stub, or the ticket records why they were not built.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Open questions

- Ceilings for designer, architect, product, herald and Bao are not decided.
- Where the ceiling file lives, and the full guardrail path list.

## Comments

- 2026-10-10, plain session (Opus 5.5): filed from the approved agent-os spec. Not started.
