# 16-security: security review of d83a1fc -- Security pass

**Cell:** security
**Ticket:** `.scratch/organism-infra/issues/16-worktree-lifecycle.md`
**Reviewed:** commit `d83a1fc` on `origin/claude/organism-infra-16-tests`, checked out detached in worktree `C:\claude_sessions\agent_office\.claude\worktrees\agent-a80c1ed9fd42a1613`
**Diff:** `git diff 3a5655c d83a1fc` -- `scripts/worktree-gc.mjs` (+/-, forgiveness rule, diff summary, branch delete) and `scripts/worktree-gc.test.mjs` (new tests only). No other files changed: no dependency, workflow, or `.claude/` changes.

## Verdict: Security pass

## Focus areas checked

1. **Can it ever remove unmerged work or the main checkout?** No.
   - `REMOVABLE` disposition requires both `unforgivable.length === 0` (every remaining dirty entry is forgiven) *and* `isAncestorOfMain(entry.headSha, mainTip)`. Genuine uncommitted/modified content is never forgivable (`isForgivableEntry` returns `false` for any tracked entry, i.e. `code !== "??"`, and for untracked content that isn't byte-identical to main or under `.claude/`), so it always lands in `DIRTY`, which is never removed even with `--apply`. Unmerged-but-clean worktrees land in `UNMERGED`, also never removed. This ordering (dirt check before ancestor check) matches the pre-existing (ticket 05) protections and both new tests (`16` forgivable-removal, unique-change-kept) plus the untouched ticket-05 tests (`merged-dirty` kept, `in-progress` kept) exercise it directly. Ran the full suite myself: 14/14 in `scripts/worktree-gc.test.mjs`.
   - Main checkout: `candidates` filtering (unchanged by this diff) explicitly excludes `resolved === rootResolved` before anything else runs, and additionally requires the path to sit under `<root>/.claude/worktrees/`. The `--apply removes ... branch ...` and forgiveness code paths only ever operate on entries already filtered into `candidates`, so the main checkout can't reach the removal code regardless of forgiveness logic. Test `--apply never removes or reports the main checkout itself` (pre-existing, untouched) still covers this.

2. **Shell/argument injection from paths or branch names.** None found. Every `git` invocation in the diff (`execFileSync("git", [...], { cwd, encoding })`) passes arguments as array elements with no `shell: true`, including the new `git show <mainTip>:<relPath>` (built as one array element via template string, but that element is never shell-parsed) and `git diff --numstat -- <relPath>` (uses `--` to stop option parsing, and `relPath` itself is a path git already reported, not attacker-supplied free text). `git branch -d <branchName>` similarly takes `branchName` as a single argv element derived from `git worktree list --porcelain`'s own `branch ` line. No path in this diff is ever concatenated into a string that reaches a shell.

3. **Path traversal in the byte-identical comparison.** No exploitable path found, one low-severity hardening note.
   - `entry.filePath` comes only from parsing `git status --porcelain --untracked-files=all`, run with `cwd: worktreePath`, so git only ever emits paths that exist inside that working tree, relative to it; git doesn't emit `../`-escaping paths for ordinary tracked/untracked files.
   - `git show ${mainTip}:${relPath}` resolves `relPath` against a **tree object**, not the filesystem, so even a crafted `../` there can't escape onto disk -- it would just fail to resolve (caught, treated as unforgivable/fails closed).
   - `readFileSync(path.join(worktreePath, entry.filePath))` (used in both `isForgivableEntry` and `diffSummaryForEntry`) *is* a real filesystem read with no explicit confinement check that the resolved path stays under `worktreePath`. Under normal git behavior this is unreachable (no `../` in status output), so I'm not treating it as a bounce, but it's a defense-in-depth gap: a follow-on could resolve the path and assert it still starts with the worktree root before reading, so the invariant doesn't rely solely on trusting git's output shape. Low severity, not blocking.

4. **`--force` widening.** Confirmed safe. `git worktree remove --force` is only reached inside `if (disposition === DISPOSITIONS.REMOVABLE && apply)`, and `REMOVABLE` already requires `unforgivable.length === 0 && isAncestorOfMain(...)`. So `--force` only ever overrides git's refusal to remove a worktree that still has *forgivable* untracked files (identical copies / `.claude/`) -- it can never be reached for a worktree carrying real, unforgivable dirt. Matches qa's read in their verify handoff; I re-derived it independently from the code rather than taking qa's word for it.

## Dependencies / secrets / CI

- No new or changed dependency (`node:fs`'s `readFileSync` is a built-in import; no `package.json`/lockfile change).
- `git diff 3a5655c d83a1fc` grepped for key/token/secret/password patterns: no matches.
- No `.github/workflows/` or branch-protection changes in this diff.

## Minor/non-blocking notes (Comments, not a bounce)

- `scripts/worktree-gc.mjs:132` (`isForgivableEntry`) / `scripts/worktree-gc.mjs:150` (`diffSummaryForEntry`): low -- filesystem reads via `path.join(worktreePath, entry.filePath)` have no explicit "resolved path stays under worktreePath" assertion. Currently unreachable given git's own output guarantees; recommend adding the check anyway next time this file is touched, as defense-in-depth rather than a fix for a live bug.
- `scripts/worktree-gc.mjs:170-176` (removal + `git branch -d`): low -- small TOCTOU window between the status scan that decided `REMOVABLE` and the `--force` removal a few lines later; a file written into the worktree in that gap could be force-deleted without being caught. Inherent to any scan-then-act cleanup script; not worth blocking on.
- Endorse qa's dismissal of the developer's two flagged cosmetic gaps (staged-file diff misreport, binary numstat rendering) as non-security, cosmetic-only, already confirmed not to affect `isForgivableEntry`'s tracked/`??`-code branch and thus not to affect DIRTY vs REMOVABLE disposition.

## Worktree receipt

Worktree: `C:\claude_sessions\agent_office\.claude\worktrees\agent-a80c1ed9fd42a1613`
Status: clean. Checked out `d83a1fc` detached to review; `git status --porcelain=v1` empty before and after review (ran `npm test`/`node --test` only, no files modified).

## Failed calls

None. All commands (git fetch, checkout --detach, diff, show, node --test, npm run board) ran and exited as expected on the first try.

## Open questions

- None blocking. The one open design question already on the ticket (whether the forgiveness rule itself -- untracked + byte-identical, or `.claude/` -- was ever confirmed with the user) is qa's/developer's noted assumption, not a security question; nothing in this review depends on that assumption being wrong in a way that would create a vulnerability (even if the rule were tightened or loosened, the removal gating in finding 1 stays intact).

## Next

Ready for the orchestrator's merge decision. Status left at `in-review` (security never sets `resolved` on a code ticket).
