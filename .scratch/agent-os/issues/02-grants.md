# 02: Grants: role ceilings and task grants for den-started agents

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** agent-os/01 (a go)

**Status:** resolved

**Serves:** agent-os step 2 (ADR 0021 decisions 2 to 5). User stories 1 to 5.

## What to build

A den-started agent in this repo works inside its worktree with no prompt, and is refused outside it.

- **Ceilings.** One data file in this repo gives each role its ceiling. Start with scout (read the project and the web, no write), developer and qa (write in the worktree, the project's hosts) and security (read, and write its report in the worktree). It is a guardrail path.
- **Task grants.** A task may carry named extras (a host, an extra path). `POST /tasks` validates them against a fixed shape. No grant text reaches argv or the prompt template.
- **Compilation.** `claude-adapter.mjs` turns ceiling plus grants into the sandbox settings and permission rules that agent-os/01 recorded. The four deny rules stay.
- **Refusals and the Start box table** moved to agent-os/05 (split, 2026-10-11). This ticket has no UI change.

## From the spike (agent-os/01, ADR 0021 amendment 1)

The spike was a go for the CLI sandbox around shell commands. It adds these to this ticket:

- **The file tools are not behind the wall.** Read, Write and Edit outside the worktree raise a request, and one that is allowed goes through. Permission rules are their boundary: allow Write and Edit in the worktree (today Write there still asks), and keep the ask, or add a deny, outside it.
- **Reads are open.** A sandboxed command read a file in the home directory unasked. Try a read limit (`sandbox.filesystem.denyRead` with `allowRead`, or `permissions.blockReadsOutsideWorkingDirectories`) with a live check, before any host is listed for a role.
- **Refusals.** Question 7 was "partly": a refused host carries a `<sandbox_violations>` block in the tool result; a refused write is only the text `Read-only file system`. The notice and the pause at three are built on that text, and the write match can be wrong.
- **The main checkout's `.git` is writable from a worktree.** The bridge should not trust a branch in the main checkout that an agent could have moved.
- **Some command shapes still ask** inside the wall ("This command requires approval"). Those requests reach Needs you as they do today.
- `buildClaudeArgs` already takes `wall: { hosts }`. This ticket makes the runtime pass it.
- **Hardware limits** moved to agent-os/06 (split, 2026-10-11).

From the security review of the spike (pass, 2026-10-10; findings in agent-os/01's comments):

- **Host names only.** `isWall` in `claude-adapter.mjs` accepts IP literals and internal names (`127.0.0.1`, `169.254.169.254`, `10.0.0.5`, `localhost.localdomain`). Reject IPs, `localhost.*` and private or link-local names before any grant reaches `wall.hosts`, and reject sparse arrays. Whether the CLI honours an IP in `allowedDomains` was not tried.
- **A read limit comes before any host.** With reads open, an agent that is given a host could send out what it can read, the CLI's own credentials included. No host is listed for an agent until the read limit is tried and holds.
- **Deny rules under the wall.** `autoAllowBashIfSandboxed` was not tried against the `git push` and `gh pr create` deny rules. Test that they still refuse with the wall on.
- **`.git/config`** in the main checkout was not probed; only `hooks` was.

## From the skill-sources grill (2026-10-11)

The user decided that the skill-sources spec's Track C items that touch the wall land here as criteria (`.scratch/skill-sources/spec.md`, "Decisions from the grill"). Sources are credited in that spec's Track C table.

- **Governance deny list**, in the ceilings data. Deny write: `.github/workflows/`, `.github/CODEOWNERS`, `.gitlab-ci.yml`, `Jenkinsfile`, and our guardrail paths. Deny run: `gh pr review`, `gh pr merge`, `gh issue close`, `gh release create`, a push to a protected branch. Security may write CI paths only under a task grant; merge and PR stay bridge calls.
- **Forbid beats permit.** A deny in a ceiling is never lifted by a grant.
- **Bypass forms.** Must-refuse cases for the compiled rules: a newline between commands, `$(...)`, backticks, `<(...)`, `git -c core.hooksPath=/dev/null`. The wall is the boundary; this shows the compiled rules open no hole above it.

## Acceptance criteria

- [ ] Failing tests first: the adapter compiles each role's ceiling, and ceiling plus a grant, into the recorded settings.
- [ ] A live check: a den-started developer task writes and runs tests inside its worktree with no permission request, and a write outside the worktree is refused.
- [ ] A grant outside the fixed shape is a 400, and a test shows no grant string in argv or the prompt.
- Moved to agent-os/05 (split, 2026-10-11): the Start box grants table.
- Moved to agent-os/05 (split, 2026-10-11): the refusal notice and the pause at three.
- [ ] Forbid beats permit: a test tries each grant shape against each deny in a ceiling, and no grant lifts a deny.
- [ ] The ceilings deny the governance paths and commands listed under "From the skill-sources grill", with a test per entry.
- [ ] A table-driven test of the compiled rules refuses each bypass form listed there.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Open questions

- Ceilings for designer, architect, product, herald and Bao are not decided.
- Where the ceiling file lives, and the full guardrail path list.

## Comments

- 2026-10-10, plain session (Opus 5.5): filed from the approved agent-os spec. Not started.
- 2026-10-10, plain session (Opus 5.5): handoff for the design session is `.scratch/agent-os/handoffs/02-plain-session.md`. It lists what the designer and the user settle before any UI code: grants at Start and wall notices now; the Open/Closed sign, Bao's body and den art if the user wants them in the same session.
- **designer, 2026-10-11:** UI spec signed off by the user 2026-10-10 (grants at Start: two-sided wall table, folded card; wall notices: ink until the pause, by kind, Keep refused restarts the count). Spec and qa mapping: handoffs/02-designer-spec.md. Mockup: https://claude.ai/artifact/Tk1KDW39ETgrbU8hrLG4NY. Next: qa specify. Written by a plain session acting as designer.
- 2026-10-11, plain session (Opus 5.5): the no-prompt backend half (ceilings, compilation, the runtime passing the wall, no hosts and no grants) is cut out as agent-os/04 at the user's choice and is built first; the ceiling file's path is settled there. This ticket keeps task grants, the Start box table, wall notices, the pause at three, the read limit and hosts, and gains three criteria from the skill-sources grill.
- **orchestrator, 2026-10-11:** Split (user, 2026-10-11): wall notices, the pause at three and the Start box table moved to agent-os/05; this ticket is backend only and qa specify's tests at 28a0244 cover it. User confirmed two qa decisions: security's CI-path write under a task grant is the one exception to forbid-beats-permit; the strict whole-string deny matcher stays until a live CLI run shows the CLI checks each part.
- **orchestrator, 2026-10-11:** User decisions after the developer's partial return (2026-10-11): (1) hardware limits move to agent-os/06; (2) fix both path-grant gaps in this ticket, with tests: a path grant that contains the worktree is a 400 from POST /tasks, not a 502 at spawn, and a path grant inside the main checkout is covered by the governance denies (forbid beats permit); (3) the scout context-hook refusal is organism-infra/219; (4) a scout diagnoses the dispatch-context jg-exit-1 failure. Partial handoff: handoffs/02-developer.md. Host grants are not usable until the ticket-file read passes under the read limit.
- **orchestrator, 2026-10-12:** Environment issue, agreed fix (user, 2026-10-11): dispatch-context's jg-exit-1 is jg itself exiting 1 for any query and any root (scout: likely a stale or missing key in the session env, about 60%, unverified; jg with only --max-output-bytes also exits 13, an unsettled top-level await in the jevgrep bin). The user restarts the app; the next session runs dispatch-context again and reports. No dispatch depends on it.
- **qa, 2026-10-12:** QA bounce (light verify, 7be73f3). Suite green: 3998 pass, 0 skipped. Bounce: .git/config probe of main checkout not done (ticket line 39, no test). Also: no test pins bare-ceiling sandbox.filesystem (qa fix); .git governed-path decision for user. Details: 02-qa-verify.md.
- **orchestrator, 2026-10-12:** User decisions after qa verify bounce 1 (2026-10-11): (1) the main checkout's .git is never grantable: add it to the governed deny list with a test, so a grant naming it or anything under it is refused. (2) One developer fix round does that change, runs the live .git/config probe of the main checkout and records the result, and adds the missing test that a ceiling with no grants has no sandbox.filesystem.allowWrite (grants.test.mjs near line 119). qa light verify then checks all three.
- **qa, 2026-10-12:** QA pass, light verify at 6ca76af. Suite 4014 pass, 0 skipped (developer's saved output, not re-run). Checks after bounce 1 pass: .git governed (grants-paths.test.mjs), .git/config probe recorded (human-verified), bare-ceiling test at grants.test.mjs:127. Security next for risk-check hits. Handoff 02-qa-verify-2.md.
- **orchestrator, 2026-10-12:** qa light verify round 2 passed on 6ca76af (02-qa-verify-2.md). Note for security and for agent-os/05: a path grant on the main checkout's .git is accepted at POST /tasks and then denied by the governed list (forbid beats permit); it is not a 400. Open for the user: whether such a grant should be a 400 instead.
- **security, 2026-10-12:** Security pass at 6ca76af. No critical or high. Medium: (1) no home-dotfile denylist for path grants (~/.ssh, ~/.claude, ~/.local/bin accepted), fix before agent-os/05 adds the grant box; (2) governed .git/** may not cover the worktree's .git pointer file for the Write tool, add bare .git (unverified); (3) .git probe covered config and hooks only, refs/HEAD/update-ref on main untested. Low: .GIT case, quoting bypass of denyRun, ticket dir read, lexical symlink containment. gitleaks on origin/main..6ca76af: no leaks. Details: 02-security.md.
