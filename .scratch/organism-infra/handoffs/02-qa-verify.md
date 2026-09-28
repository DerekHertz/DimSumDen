# organism-infra/02 -- QA verify (light) handoff

**Verdict:** PASS

**Mode:** Light verify (qa wrote the tests in specify at fdd4d01).

**Checked out:** developer commit 2850cdd on branch claude/organism-infra-02-board-cli, via a detached checkout in a scratch worktree (separate from the worktree where the developer's branch lives).

## What was done

1. npm install -- node_modules was absent in this worktree, installed clean, no new dependencies.
2. npm test (full suite): 81/81 pass, exit 0, including all 19 board-cli.test.mjs cases.
3. Diff of qa's specify commit fdd4d01 against developer commit 2850cdd, restricted to apps/organism-infra/board-cli.test.mjs and apps/organism-infra/board-fixture.mjs: empty. No test weakened, deleted, or had assertions changed.
4. Manual spot-check against a disposable temp fixture (never the real board -- created under a system temp dir, deleted after):
   - board claim demo-feature/01-thing qa -> "claimed demo-feature/01-thing: claimed", exit 0
   - board status demo-feature/01-thing -> "claimed"
   - board list -> "demo-feature/01-thing<TAB>claimed"
   All ran via ORGANISM_ROOT pointed at the fixture. No processes were left running.

## Criteria check

- Main-checkout writes / worktree + ORGANISM_ROOT resolution -- passing tests + manual confirmation above.
- Two concurrent claims, exactly one wins -- passing test (test 3).
- Locking behavior (stale reclaim, live-lock protection, claim lock never auto-expiring) -- passing tests 4-8.
- Atomic writes + events.jsonl, no temp-file leftovers -- passing tests 9-12.
- Comment stamped with cell type + date -- passing test 13.
- Validation (path traversal, oversized args, symlink escape) -- passing tests 14-17.
- status/list output -- passing tests 18-19.
- human-verified (unchanged from specify): genome/protocol wording change, and "runs the full code relay" (this relay itself running is the verification).

## Next

Security review of 2850cdd on claude/organism-infra-02-board-cli. Status left at in-review (orchestrator holds the claim lock; not touched here).
