# 04: No-prompt slice: a den-started agent works in its worktree without asking

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** none (PR #217 merged 2026-10-11)

**Status:** resolved

**Serves:** agent-os step 2, first PR (ADR 0021 decisions 2 to 5). User stories 1 and 2. It is the backend half of agent-os/02 with no grants and no hosts; agent-os/02 keeps the rest.

## What to build

A den-started agent in this repo runs its shell commands behind the wall and edits files in its worktree, with no permission request. Outside the worktree it is refused or asks, as agent-os/01 recorded. No UI change.

- **Ceilings.** One data file in this repo gives each role its ceiling: scout (read the project and the web, no write), developer and qa (write in the worktree), security (read, and write its report in the worktree). No role has a host yet. The file is `apps/bridge/cells/ceilings.json`, beside `policy.mjs` (user, 2026-10-11). It is a guardrail path: add it to risk-check's guardrail list in this ticket.
- **Compilation.** `claude-adapter.mjs` turns a role's ceiling into the sandbox block agent-os/01 recorded, plus permission rules that allow Write and Edit inside the worktree for the roles that write. The spike found Write in the worktree still asks today. Outside the worktree the ask stays. The four deny rules stay.
- **Runtime.** `claude-runtime.mjs` passes the wall. `buildClaudeArgs` already takes `wall: { hosts }`; the `spawn` in `claude-runtime.mjs` does not pass it. Hosts are an empty list for every role.
- **Roles with no ceiling** (designer, architect, product, herald, orchestrator) start as they do today, with no wall, until their ceilings are decided.

Not in this ticket (all stay on agent-os/02): task grants and `POST /tasks` validation, the Start box table, wall notices, the pause at three, the wall request, the read limit, host lists, `systemd-run` limits.

## Carried from the spike's security review

- Test that the `git push` and `gh pr create` deny rules still refuse with the wall on (`autoAllowBashIfSandboxed` was not tried against them).
- `isWall` accepts an empty host list; keep it that way and add no host here. The IP and `localhost.*` rejection belongs to agent-os/02, with the first grant.
- Some command shapes still ask inside the wall. Those requests reach Needs you as today; this ticket does not chase them.

## Acceptance criteria

- [ ] Failing tests first: the adapter compiles each of the four ceilings into the recorded settings, and a role with no ceiling gets today's settings.
- [ ] A test shows a diff that touches `apps/bridge/cells/ceilings.json` is a risk-check hit.
- [ ] A test shows the runtime passes the wall for a role with a ceiling.
- [ ] A test or live check shows `git push` and `gh pr create` are still refused with the wall on.
- [ ] A recorded live check: a den-started developer task writes a file and runs tests inside its worktree with no permission request, and a shell write outside the worktree is refused.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Open questions

- Whether the wall being unavailable (`failIfUnavailable`) should stop the Start with a clear message in the den. Today the CLI would just fail to start.

## Comments

- 2026-10-11, plain session (Opus 5.5): cut from agent-os/02 at the user's choice (question tool: "No-prompt slice of 02"). The user wants agents usable from the den without the constant requests before the grants UI is built. Not started. Next: qa specify.
- 2026-10-11, plain session (Opus 5.5): the user settled the ceiling file's path (question tool): `apps/bridge/cells/ceilings.json`, on risk-check's guardrail list. PRs #217 and #218 are merged, so nothing blocks this. The Track C items from the skill-sources spec go on agent-os/02, not here.
- **qa, 2026-10-11:** Light verify: suite 3509/0/0 from developer's saved run; qa test files unchanged; criteria mapped. Open: gitleaks not covered, orchestrator to confirm before merge. See 04-qa-verify.md.
- **security, 2026-10-11:** Security pass. No critical/high. Low: claude-adapter.mjs:69 isWorktreePath accepts any plain absolute path (caller passes host-made workspace.dir only; tighten if cwd ever comes from elsewhere). gitleaks clean, no dep/CI change, 35 tests green. Detail in 04-security.md.
