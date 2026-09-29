```json
{
  "ticket": "organism-infra/34-worktrees-base-on-prior-hop",
  "current_step": "security review: Security pass",
  "artifacts": ["feature/organism-infra-34-cell-start @ 3955bac", "scripts/cell-start.mjs", "scripts/cell-start.test.mjs", "docs/agents/cell-start.md"],
  "decisions": [
    "Security pass. No critical or high findings. Diff 93e838c..3955bac is 3 files (script, test, doc).",
    "No shell: git and npm run via spawnSync argv arrays, no shell option. Probed metacharacters in --base and --branch: nothing executed.",
    "Argument injection: --branch is prefixed refs/heads/ for show-ref and git rejects leading-dash names ('-x', '-c', '-fooo'), HEAD, a..b, spaces. --base is resolved by rev-parse --verify to a full sha before git switch, so a leading dash never reaches switch. Both exit 1 with HEAD unmoved.",
    "Main-checkout refusal held from the main root, a subdirectory, a symlink to main, and with GIT_DIR/GIT_WORK_TREE set. Dirty check counts untracked files; git switch without --force cannot discard local edits.",
    "Deps: no new dependency, no secrets in the diff, lockfile has no install scripts (hasInstallScript count 0)."
  ],
  "failures": [],
  "pending": [
    {"item": "MEDIUM scripts/cell-start.mjs:66 npm ci can rewrite the main checkout's node_modules. Worktrees nest inside main (.claude/worktrees/), and npm finds its project root by walking up from cwd. If --base names a commit with no root package.json (anything before 57f6ba2), npm climbs to the main checkout and reinstalls there. Reproduced in a scratch repo: main's node_modules was replaced. Fix: pass { cwd: toplevel } and fail if package.json is missing at toplevel in the base tree (check git cat-file -e <sha>:package.json before switching).", "owner": "developer"},
    {"item": "LOW scripts/cell-start.mjs:44-49 the main-checkout check fails open if `git worktree list` fails (status unchecked, `first` undefined). Also porcelain output quotes unusual paths, so realpathSync throws (fails closed, but blocks cells) on a quoted path. Fix: check list.status and use `worktree list --porcelain -z`.", "owner": "developer"},
    {"item": "LOW scripts/cell-start.mjs:66 npm ci runs lifecycle scripts and reads .npmrc from the commit under review. Today's lockfile has none. For security and qa-verify hops consider `npm ci --ignore-scripts`; a trade-off, so left to the orchestrator.", "owner": "orchestrator"},
    {"item": "LOW scripts/cell-start.mjs:28 the value check rejects `--x` but allows `-x`. Harmless (git rejects it) but `v.startsWith('-')` is tighter.", "owner": "developer"}
  ]
}
```

# 34 security

Verdict: Security pass. Medium and low findings do not block.

## Findings
- MEDIUM scripts/cell-start.mjs:66 - `npm ci` with no `cwd` climbs out of a base-commit worktree that lacks package.json and reinstalls in the main checkout. Repro: scratch repo, main with `node_modules/SENTINEL`, nested worktree, `--base <commit without package.json> --detach`. The sentinel was gone afterwards. Needs an unusual base sha (orchestrator takes it from a handoff, and every real hop descends from main), so it is not blocking. It is the one path I found that touches the main checkout.
- LOW scripts/cell-start.mjs:44-49 - fail-open when `git worktree list` fails; quoted porcelain paths throw.
- LOW scripts/cell-start.mjs:66 - `npm ci` runs lifecycle scripts and .npmrc from the reviewed commit; none exist today.
- LOW scripts/cell-start.mjs:28 - `-x` values are accepted at parse time; git rejects them later.

## Checked and clean
- No shell use (spawnSync argv arrays). `$(...)` and `; touch` payloads in --base and --branch did nothing.
- Leading-dash, `HEAD`, `a..b` and spaced branch names are refused by git; HEAD stayed put.
- `--base main` (a ref name) resolves to a sha and works, as intended.
- Refusals hold from the main root, a main subdirectory, a symlink to main, and with GIT_DIR/GIT_WORK_TREE set. `main` HEAD did not move in any case.
- Test file (scripts/cell-start.test.mjs) uses disposable tmp repos and a stub npm on PATH; no writes to the real board or main checkout. It imports resolveRoot only.
- No secrets, no new dependency.

Probes were run in scratch repos under the session scratchpad, not the real repo.
