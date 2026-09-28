# 05: Security review — scripts/worktree-gc.mjs (PR #17, SHA 21bdf02)

**Cell:** security
**Ticket:** organism-infra/05-dispatch-into-existing-branch (Status left at `in-review`; qa had passed it)
**Branch reviewed:** claude/organism-infra-05-tests at 21bdf02, via detached checkout in this cell's own worktree
**Diff scope vs origin/main (a5100bb):** scripts/worktree-gc.mjs (+157), scripts/worktree-gc.test.mjs (+289) — matches the approved scope, nothing else touched.
**Tests:** re-ran `node --test scripts/worktree-gc.test.mjs` at 21bdf02: 9/9 pass, confirming qa's verify.

## What I checked

- Command injection: every git invocation goes through `execFileSync("git", [...args])` with array-form arguments and no `shell: true` anywhere in worktree-gc.mjs. Nothing concatenates untrusted strings into a shell command. No injection found.
- Path handling: the `.claude/worktrees/` candidate filter (`(resolved + "/").startsWith(worktreesRoot)`, both sides forced to trailing-slash absolute forms) correctly avoids the classic sibling-prefix bug (e.g. a directory named `.claude/worktrees-evil` does not match). Good.
- Secrets: `git diff a5100bb..21bdf02 -- scripts/worktree-gc.mjs scripts/worktree-gc.test.mjs` grepped for key/token/password/PEM patterns — nothing found.
- Dependencies: no package.json/lockfile changes in this diff; nothing to gate.
- Deletion safety: `git worktree remove` is called without `--force`, and git itself independently re-checks dirtiness at remove time (refuses on uncommitted changes), so a TOCTOU race between this script's `isDirty()` check and the actual remove fails safe (throws) rather than deleting live work. Locked worktrees are correctly skipped via git's own `locked` porcelain field.

## Finding: High — the "must be main checkout" guard is non-functional

`worktree-gc.mjs:108-114` (added in 21bdf02 specifically to close a gap the prior code review flagged: "documented but unenforced"):

```js
const isMainCheckout = entries.some((e) => normalizedAbsolutePath(e.worktreePath) === rootResolved);
if (!isMainCheckout) {
  console.error(`worktree-gc: --root ${root} is not the main checkout ... Refusing to run from inside a worktree.`);
  return 1;
}
```

`entries` comes from `git worktree list --porcelain` run with `cwd: root`. I verified live (throwaway repo, script at `scratchpad/wtcheck.mjs`) that this command's output is **identical** whether it's run from the main checkout or from a linked worktree — git always lists every worktree of the repo, main first, regardless of cwd. So `entries.some(...)` is true whenever `root` equals *any* worktree path known to the repo, not specifically the main one. The check does not distinguish "main checkout" from "linked worktree" at all.

Impact: `parseArgs` defaults `root` to `process.cwd()` when `--root` is omitted. A cell (or the orchestrator) running `node scripts/worktree-gc.mjs --apply` from inside its own worktree — the normal state for a dispatched cell, as this very review session's cwd shows — will pass the guard that was written to reject exactly that. In the current code this degrades to a silent no-op (`worktreesRoot` becomes `<that-worktree>/.claude/worktrees/`, which nothing matches, so it prints "no agent worktrees found" and exits 0) rather than deleting anything unintended. But that's still a real problem: it fails silently instead of erroring, gives false confidence — both the code comment and the qa verify note ("guards against running from inside a worktree", worktree-gc.mjs:108-114) assert a guarantee the code doesn't provide — and the failure mode (stale worktrees quietly never get collected because gc keeps "succeeding" from the wrong directory) is the exact pile-up problem ticket 05 exists to fix.

No test exercises this path, despite it being named explicitly in the test file's own doc comment (`worktree-gc.test.mjs:18-19`: "must be the *main* checkout ... not one of the worktrees themselves") and being the stated purpose of the 21bdf02 commit.

**Suggested fix:** this repo already has the right pattern next door. `apps/organism-infra/board-service.mjs:60-77` (`resolveRoot`) solves the identical problem by taking the regex match against the *first* `worktree ` line of the same porcelain output (main is always first). `worktree-gc.mjs` should do the same — compare `--root` against `entries[0]`, not `entries.some(...)` — and add a test that runs the script with `--root` pointed at a linked worktree and asserts it exits 1 without touching anything.

## Comments

- `scripts/worktree-gc.mjs:108-114` — **High** — the root/main-checkout guard added in 21bdf02 does not, in any case, distinguish the main checkout from a linked worktree; `git worktree list --porcelain` lists the same entries regardless of cwd, so `entries.some(...)` passes for any worktree path. Currently fails safe (no-op) rather than deleting, but silently defeats its stated purpose, and the default (`--root` omitted → `process.cwd()`) makes this the likely path, not an edge case. Bounce for a fix + a regression test.
- No other findings. No command injection, no secrets, no new dependencies, path-prefix filtering is sound, and `git worktree remove`'s own dirty-check backstops the TOCTOU window in `isDirty()`.

## Verdict

Security bounce
