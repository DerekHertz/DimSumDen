# Handoff: organism-infra/12 (qa, specify)

**Branch:** `claude/organism-infra-12-tests` @ 4ff6034 (base: main @ 5eb06a6)
**Test file:** `apps/organism-infra/board-comment-hardening.test.mjs` (5 tests, new)

## Criterion -> test map

1. Comment forging cannot produce a forged attributed stamp line ->
   `"a forged stamp embedded in comment text cannot appear as its own attributed comment line"`
   (line ~24). Red today: current code stores the raw text verbatim, so an
   embedded `\n- **security, <date>:** ...` becomes a second real stamp line.
2. Containment re-verified at the actual write (symlink swap) ->
   `"a symlink retargeted mid-wait cannot redirect a comment write outside the board root"`
   (line ~100). Holds the write lock ourselves to force the child into its
   bounded retry loop, then retargets `.scratch/<feature>` from an in-root
   symlink to an attacker directory outside root mid-wait.
3. Reclaim tombstones cleaned up -> `"an orphaned reclaim tombstone left
   behind by a prior stale lock is cleaned up"` (line ~171). Pre-places a
   `.reclaim-<hash>-<g>` file with no matching live/stale lock (security's
   "orphaned tombstone" finding) and asserts a normal `comment` sweeps it.
4. Added scope (`--as`/unknown flags): two tests assert `board comment <ref>
   --as x "text"` never stores the literal string `"--as"`, and that an
   unrecognized flag is rejected (nonzero exit) rather than silently
   absorbed as the ref/text.

## Run result: 5 tests, 1 pass / 4 fail (red)

- Tests 1, "--as", unknown-flag, and tombstone-cleanup fail for the right
  reason: manually reproduced each bug (`--as` stored verbatim, forged
  stamp becomes a real second line, no flag validation exists, no orphan
  sweep exists).
- The symlink/TOCTOU test currently reports "ok" only because this sandbox
  can't create directory symlinks (`EPERM`, same limitation already
  documented at `board-cli.test.mjs:372`) -- it skips rather than exercises
  the race. It is not proof the TOCTOU gap is closed; it needs to run on an
  environment with symlink privilege (Linux CI, or Windows dev mode) to be
  meaningful. Flagging this so `verify` reruns it somewhere that isn't
  privilege-gated, or treats it as `human-verified` if that's never
  available in CI.

Existing 34 tests (status/lock, reclaim-race, CLI) still pass unchanged --
no regressions from adding this file.

## Comments

No `human-verified` items: all three checklist criteria and the added
`--as`/flag scope have automated tests, though the containment test's
real signal depends on a symlink-capable environment (see above).

Ticket status left as `ready-for-agent` for the developer, per instruction.
