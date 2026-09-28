# 25-qa-specify

**Cell:** qa | **Mode:** specify | **Ticket:** organism-infra/25-shell-and-git-guidance

**Scope:** only the criterion "A pre-commit or CI check rejects a BOM in `.md` and `.json` files (test)". Items 1-6 (protocol prose) and item 7 (npm ci on worktree creation) are out of scope — orchestrator's.

## Branch

`claude/organism-infra-25-tests`, pushed to origin.

## Seam chosen

Followed the existing `scripts/risk-check.mjs` + `scripts/risk-check.test.mjs` pattern: a standalone Node script under `scripts/`, picked up automatically by the repo-wide `npm test` glob (`"scripts/**/*.test.mjs"` in `package.json`), which CI's `test` job already runs via `npm test` (`.github/workflows/ci.yml`). No new CI step or hook config needed — the script becomes both the pre-commit-hookable primitive and the CI-enforced check once it exists and its test passes. Didn't add a `.git/hooks` or husky wiring since none exists in the repo yet; that's a separate concern from the tested behavior.

## Test file

`scripts/bom-check.test.mjs` — specifies `scripts/bom-check.mjs` (not yet implemented):

- Usage: `node scripts/bom-check.mjs [file ...]`. With no args, defaults to scanning git-tracked `*.md`/`*.json` files (the CI/pre-commit default). With explicit args, checks exactly those paths.
- Exit 0 when clean, non-zero when any `.md`/`.json` file among the targets starts with a UTF-8 BOM (`EF BB BF`), printing the offending path(s).

Criterion-to-test map (single criterion, six tests):
1. "rejects a UTF-8 BOM in a .md file and names it"
2. "rejects a UTF-8 BOM in a .json file and names it"
3. "passes a clean .md file and a clean .json file"
4. "ignores a BOM in a file whose extension isn't .md or .json"
5. "a mix of one clean and one BOM-prefixed file fails and names only the offender"
6. "with no arguments, defaults to scanning git-tracked .md and .json files"

## Run command

`node --test "scripts/bom-check.test.mjs"` (or `npm test`, which globs it in).

## Red confirmation

All 6 tests fail with `Cannot find module '.../scripts/bom-check.mjs'` (`MODULE_NOT_FOUND`) — the script doesn't exist yet. That's the missing feature, not a setup/syntax error in the test file. Full run output not pasted here per token hygiene; rerun the command above to see it.

## Worktree

`C:\claude_sessions\agent_office\.claude\worktrees\agent-adf4ac41f97440edd` — clean (test file committed and pushed; nothing else touched).

## Open questions for the developer / orchestrator

- Whether a `.git/hooks/pre-commit` (or husky) should actually be wired to call `bom-check.mjs`, or whether CI-only enforcement (via `npm test`) satisfies "pre-commit or CI check" for this ticket. My tests only pin the script's behavior, not the hook wiring — left that call to the developer since the ticket phrases it as "pre-commit **or** CI".
- Whether the default (no-args) mode should scan the whole repo's tracked `.md`/`.json` files or only the staged/diffed set. I specified whole-repo-tracked as the default (matches a CI-wide sweep); a pre-commit hook would presumably pass staged files explicitly as args, which the script also supports.

## Failed calls

None. `npm ci`, test run, branch/commit/push all succeeded on first try.
