```json
{
  "ticket": "organism-infra/158-work-never-one-machine",
  "cell": "security",
  "current_step": "security review complete at 8b15c66: pass, no critical or high findings",
  "artifacts": [],
  "decisions": ["pass; medium and low findings go to Comments and do not block"],
  "failures": [],
  "pending": [
    {
      "item": "optional follow-ups: validate branch names in session-check fix strings; run gitleaks before board-only pushes to main",
      "owner": "developer"
    }
  ]
}
```

# Handoff: 158 security

Branch `158-work-never-one-machine`, head 8b15c66. Reviewed `origin/main...HEAD` (code, tests, fixture, `.claude/` edits). Verdict: **Security pass**.

## Checks run
- gitleaks `origin/main..8b15c66`: 3 commits scanned, no leaks.
- No dependency, lockfile, workflow or branch-protection change; package.json only adds the `session-check` script.
- Tests and fixture push only to local bare repos in tmpdir; nothing touches a real remote.

## Findings
- medium: `.claude/agents/orchestrator.md:109` lets the orchestrator push board-only commits to `origin/main` with no gate. The repo is PUBLIC and `main` is unprotected (API 404). CI (`ci.yml`) runs gitleaks on `push`, but only after the push, so a secret in a board file would already be public. Suggest the orchestrator run `gitleaks detect --log-opts="origin/main..main"` before the push (propose in the rule; not a bounce).
- low: `scripts/session-check.mjs:158-161` (and `:146,:154`) prints `git push -u origin ${branch}` where `branch` is parsed from handoff prose (`[^`\s]+`). When the branch exists in neither local refs nor origin it is unvalidated text, so a `$(...)` or `;` payload would land in a copy-paste fix command an agent might run. Suggest requiring `^[A-Za-z0-9._/-]+$` (or `git check-ref-format --branch`) and skipping otherwise. Same for the feature dir name in `:86`.
- low: `apps/organism-infra/board-service.mjs:1105-1107` runs the push (120 s timeout) while the board lock is held, so a hung remote blocks other board writers for up to 2 minutes. Acceptable; the failed push correctly refuses before any write.
- low: `board-service.mjs:970-1000` pushes whatever branch the cwd has checked out (`HEAD` to the same-named remote branch). With `main` skipped and a detached HEAD skipped, that is the intended behavior. Pushed via `execFileSync` with an args array, no shell, `GIT_TERMINAL_PROMPT=0`, so no injection or credential prompt.

## Reviewed, clean
- `session-check.mjs` git calls use args arrays; branch names go into `refs/...` or `origin/x..x` strings, so none can parse as an option. It reads local refs only. `-z` porcelain parsing handles odd filenames.
- `.claude/` wording: the `git diff --name-only origin/main..main` path check covers every unpushed commit. Merges and code PRs stay gated. `board release` never pushes `main`.
