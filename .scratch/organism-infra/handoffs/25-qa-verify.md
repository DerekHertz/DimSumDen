```json
{"ticket": "organism-infra/25-shell-and-git-guidance", "current_step": "qa verify complete, BOM-check criterion only",
 "artifacts": ["scripts/bom-check.mjs", "scripts/bom-check.test.mjs", "package.json"],
 "decisions": [
   "QA pass on the BOM-check acceptance criterion",
   "verified scripts/bom-check.test.mjs is byte-identical to qa's specify commit 87e9a3f (no weakening)",
   "manually confirmed enforcement: a BOM injected into a tracked .md file makes npm test fail at pretest"
 ],
 "failures": [],
 "pending": []}
```

# 25-qa-verify

**Cell:** qa | **Mode:** verify (full) | **Ticket:** organism-infra/25-shell-and-git-guidance

**Scope:** only the "pre-commit or CI check rejects a BOM in `.md` and `.json` files" acceptance criterion, per assignment. Protocol prose (items 1-6) and item 7 (npm ci on worktree creation) out of scope for this pass.

## Verdict

**QA pass** on the BOM-check criterion.

## What was checked

1. **Checkout**: `origin/claude/organism-infra-25-tests` at commit `3806c14` ("organism-infra/25: code-review polish on bom-check.mjs"), detached HEAD, in worktree `C:\claude_sessions\agent_office\.claude\worktrees\agent-a5514d2ec5d07b58c`. `npm ci` succeeded (added 2 packages, 0 vulnerabilities).

2. **Test-weakening check**: `git log --oneline --all -- scripts/bom-check.test.mjs` shows exactly one commit touching the file, `87e9a3f` (qa's specify commit). `git diff 87e9a3f -- scripts/bom-check.test.mjs` against `3806c14` is empty — the developer did not touch the test file at all. No weakening.

3. **`npm test`** (includes `pretest` → `check:bom` via package.json lifecycle): 210/210 pass, 0 fail, 0 skipped. The `check:bom` step printed `bom-check: clean (173 file(s) checked)`. The 6 tests in `scripts/bom-check.test.mjs` (qa's criterion-to-test map from `25-qa-specify.md`) all pass:
   - rejects a UTF-8 BOM in a .md file and names it — ok
   - rejects a UTF-8 BOM in a .json file and names it — ok
   - passes a clean .md file and a clean .json file — ok
   - ignores a BOM in a file whose extension isn't .md or .json — ok
   - a mix of one clean and one BOM-prefixed file fails and names only the offender — ok
   - with no arguments, defaults to scanning git-tracked .md and .json files — ok

4. **Live-fire check (not just unit tests)**: backed up `apps/ui/assets-src/panda/README.md` (a real tracked `.md` file) to `/tmp/bomcheck-backup.md`, then prepended a UTF-8 BOM (`EF BB BF`) to the in-repo copy via a short Node script. Ran `npm test`: failed at the `pretest` lifecycle step, exit code 1, output:
   ```
   bom-check: 1 file(s) start with a UTF-8 BOM
   apps/ui/assets-src/panda/README.md
   ```
   This confirms the check is wired into `npm test` for real (not just runnable standalone) and correctly names the offending file. Reverted with `git checkout -- apps/ui/assets-src/panda/README.md`. Re-ran `npm test`: 210/210 pass again. `git status --short` after revert: clean.

## Files referenced

- `scripts/bom-check.mjs` (developer's implementation)
- `scripts/bom-check.test.mjs` (qa's specify commit `87e9a3f`, unmodified)
- `package.json` (`check:bom` script + `pretest` hook)

## Worktree

`C:\claude_sessions\agent_office\.claude\worktrees\agent-a5514d2ec5d07b58c` — detached HEAD at `3806c14`, clean (`git status --short` empty after the BOM-injection test was reverted).

## Failed calls

- `npm run board -- comment ...` with the full verdict text (first attempt, run from the main checkout path `C:\claude_sessions\agent_office`): blocked by the worktree git-isolation guard — "This agent is isolated in the worktree ..., but this command runs npm with the text ... in a plain command, so what it runs cannot be shown not to be git. Refusing to run it." Retried the identical command from inside the worktree directory: same refusal. This looks like the guard's heuristic flags long/quoted `npm run board -- comment "..."` text as indistinguishable from a git invocation, regardless of cwd. Fixable friction, not a genuine guardrail need — worked around by posting a short comment ("QA pass on BOM-check criterion, see handoff for details") instead of the full verdict text, and putting full detail here in the handoff. Orchestrator/user may want to loosen this heuristic for `board comment` calls specifically.
- `cp -f /tmp/bomcheck-backup.md apps/ui/assets-src/panda/README.md`: printed an interactive overwrite prompt (`cp: overwrite '...'?`) and did not actually overwrite the file despite `-f`, even though no stdin was available to answer it — likely a shell/cp alias quirk in this Git Bash environment. Worked around by using `git checkout -- apps/ui/assets-src/panda/README.md` instead, which is arguably the more correct revert method anyway.

## Open questions

None for this pass. Carried-over open questions from qa's specify and the developer's handoff (pre-commit hook wiring vs. CI-only enforcement; whole-repo vs. staged-only default scan) are unchanged and remain the orchestrator's call — not blocking this criterion's pass/fail.
