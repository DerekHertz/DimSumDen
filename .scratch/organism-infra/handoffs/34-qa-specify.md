```json
{
  "ticket": "organism-infra/34-worktrees-base-on-prior-hop",
  "current_step": "qa specify done: failing tests committed",
  "artifacts": ["tests/organism-infra-34-cell-start @ 08420c8", "scripts/cell-start.test.mjs"],
  "decisions": ["Pinned CLI: node scripts/cell-start.mjs --base <sha> (--branch <name> | --detach). Exactly one mode required; --base required.", "npm is stubbed on PATH in tests; helper must call `npm ci` with cwd = the worktree (argv exactly `ci`).", "Refusals (main checkout, dirty incl. untracked, unknown sha, existing branch name, bad args) exit non-zero, write an explanation to stderr, and leave HEAD, branches and npm untouched. Main-checkout message must match /main checkout/i; dirty message /dirty|uncommitted|clean/i.", "Main-checkout detection: worktree toplevel equals the first entry of git worktree list."],
  "failures": [],
  "pending": [
    {"item": "Write scripts/cell-start.mjs", "owner": "developer"},
    {"item": "Describe the mechanism in .claude/agents/orchestrator.md or docs/agents/*.md (test greps for the string cell-start); .claude/ edits need the orchestrator/user, so the developer may need to put it under docs/agents/", "owner": "developer"}
  ]
}
```

# 34 qa specify handoff

Branch: tests/organism-infra-34-cell-start (commit 08420c8), based on 93e838c.
Test file: scripts/cell-start.test.mjs (node --test)

State: done. 11 tests: 10 red, 1 green.

## Criterion-to-test map
- C1 (developer starts on qa's tests commit, no manual merge): test 1 (--branch at a sha on a side branch; HEAD, branch name, file from that commit, npm ci in worktree). RED.
- C2 (reviewers detached at developer's commit): test 2 (--detach). RED.
- C3 (mechanism documented): test 11 greps orchestrator genome and docs/agents/*.md for `cell-start`. RED.
- Mechanism refusals: main checkout (3), modified tracked file (4), untracked file (5), unknown sha (6), existing branch (7), argument errors (8), npm ci failure propagates (9). All RED. Each refusal asserts stderr is non-empty and not a module-not-found error, so they cannot pass vacuously.
- Scope added (from 29): test 10, resolveRoot from a worktree with ORGANISM_ROOT unset returns the main checkout. GREEN today (regression guard).

## Notes
- All red tests fail on `Cannot find module scripts/cell-start.mjs` (or the missing docs mention), not on fixture errors.
- Fixture: temp main repo, side branch `prior` with the "qa tests" commit, an Agent-tool-style detached worktree under .claude/worktrees/.

## jg vs grep
jg 1 call (found resolveRoot and test files; useful). grep 2 calls (line-level detail).
