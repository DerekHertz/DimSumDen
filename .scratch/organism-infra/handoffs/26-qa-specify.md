# 26 qa specify handoff

Branch: tests/organism-infra-26-gc-main-copies (commit 3398308)
Test file: scripts/worktree-gc.main-copies.test.mjs (node --test, same convention as worktree-gc.test.mjs)

## Criterion-to-test map
- Criterion 1 (forgive main-disk copy): test 1, FAILS for the right reason (worktree not removed).
- Criterion 2 (differing file kept): test 2 (passes today; guards over-forgiving). Test 3 extra guard for a file absent from main (passes today).
- Criterion 3 (no fatal: on dry run): test 4, FAILS (stderr has `fatal: path ... does not exist`).
- Ticket item 3 (optional diff-summary for staged/binary): not tested.

## Notes for developer
- Compare the worktree file to root/relPath on disk (Buffer compare) in addition to the show-from-main check; silence that command's stderr.
- Tests use spawnSync to capture stderr separately.

## jg vs grep
jg 1 call (found worktree-gc.mjs and its test in one shot, useful). grep 1 call (test names in a known file). ls-files 1.
