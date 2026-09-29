# 26 security review: PASS

Branch feature/organism-infra-26-gc-main-copies, commit 85bca1f, diff 678ad35..85bca1f (scripts/worktree-gc.mjs, scripts/worktree-gc.main-copies.test.mjs). No dependency, workflow, or lockfile changes.

## Findings

None at critical or high. Low or informational only:

- scripts/worktree-gc.mjs:126 (low, informational): `readFileSync(path.join(root, entry.filePath))` follows symlinks. entry.filePath comes from `git status --porcelain` inside the worktree, so it is repo-relative and cannot escape via `..`. The bytes are only compared with Buffer.compare and never printed or written, so there is no disclosure. A worktree symlink whose target equals main's copy would be forgiven, and removing the worktree only deletes the link. Acceptable.
- scripts/worktree-gc.mjs:90-92 (low, pre-existing): porcelain quoted names have their quotes stripped but their escapes are not decoded. An odd filename fails to resolve and returns false, so the worktree is kept. Fails safe.

## Checked

- Command injection: every child process is `execFileSync("git", [...])` with an argv array and no shell. `git show <mainTip>:<relPath>` is prefixed by a SHA, so it cannot be read as an option. The `stdio: ["ignore","pipe","ignore"]` change only silences stderr.
- Path handling: reads are limited to the worktree and to the same relative path in the main root. Untracked directories give EISDIR, which is caught and returns false (keep).
- Failure direction: every catch returns false, meaning keep the worktree, so errors never cause a deletion.
- Test file: spawns node with fixed args, uses mkdtemp temp repos, and removes only those. No network and no writes outside tmp.
- Secrets: pattern grep over the commit range found nothing (gitleaks not run).
- `npm ci` reports 0 vulnerabilities. The new test file passes 4 of 4.
