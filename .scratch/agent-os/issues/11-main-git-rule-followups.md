# 11: Main .git rule fails closed on an unusual repo path; preflight refusal tested

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** 09

**Status:** resolved

**Serves:** ADR 0021 Amendment 2. Closes security's two medium findings on agent-os/09 (`.scratch/agent-os/handoffs/09-security.md`). It must merge before agent-os/03 (target projects), because another repo's path may not be plain.

## What to build

Read security's handoff `.scratch/agent-os/handoffs/09-security.md` and qa's `.scratch/agent-os/handoffs/09-qa-verify-2.md`; they hold the details. In short:

- `apps/bridge/cells/claude-runtime.mjs` (about line 59) drops the `mainGit` denies silently when the repo path has a character outside `[A-Za-z0-9._@+-]`, such as a space. The spawn then runs with the main checkout's `refs`, `HEAD`, `packed-refs` and `index` writable. Make it fail closed: the spawn is refused (security suggests the host answers 502, or the runtime throws) and no agent starts without the denies.
- The host's preflight refusal (`apps/bridge/cells/host.mjs`, the 502 branch) has no committed test.
- `publish` for an agent that made no commit (branch at the base HEAD) has no test.

## Acceptance criteria

- [ ] Failing tests first: a worktree task whose main `.git` path holds a space (and one other character outside the plain set) never spawns with the denies missing; it is refused, or the denies apply.
- [ ] A committed test covers the host's preflight refusal: the status code, the runtime never asked to spawn, no worktree left, and the reservation released (a second dispatch does not get 409).
- [ ] A committed test pins what `publish` does for an agent that made no commit.
- [ ] The agent-os/02, 07 and 09 tests are unchanged and green.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures; full `security` reviews the branch.

## Comments

- **orchestrator, 2026-10-12:** filed on the user's decision (2026-10-12) to merge agent-os/09 (PR #227) and fix security's medium findings in a follow-up. Security's two low findings on 09 are not ticketed: `publish` runs `rev-parse HEAD` unsandboxed in a directory the agent controls, and `git pack-refs` in `prepareMainGit` can race a concurrent git command. The repo at `/home/dhertzell/dimsumden` has a plain path, so the rule holds here.
- **orchestrator, 2026-10-12:** the user approved the relay with full verify (Sonnet) straight after the developer, skipping light verify, because light verify escalated on agent-os/07 and 09 over the same kind of process-only criterion (criterion 5 here).
- **qa, 2026-10-12:** QA pass (full verify) at 4fe958c: suite 4314/4314 from the developer's output, new file 28/28, specify tests unchanged, diff touches only claude-runtime.mjs. Criterion 5 is process-only. Details in 11-qa-verify.md.
- **security, 2026-10-12:** Security pass at 4fe958c. No critical/high/medium. Low: claude-runtime.mjs:62 mainGit undefined still spawns without denies (unreachable; host always passes it). gitleaks clean, no dep/CI change. Details in 11-security.md.
- **orchestrator, 2026-10-12:** Retro 2026-10-12: the pending item in handoffs/11-qa-specify.md names agent-os/02, which is resolved; nothing is left open on it. Recorded for board audit.
