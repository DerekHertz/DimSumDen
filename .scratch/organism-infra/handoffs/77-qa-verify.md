```json
{"ticket": "organism-infra/77", "cell": "qa", "mode": "verify",
 "current_step": "Done. QA pass. All 39 specify tests pass, test files unchanged, all ACs covered.",
 "artifacts": [],
 "decisions": [
   "wake test 'includes new comment but not handoff text' omits author and expects Jev call: flagged as security note, not a bounce (see below).",
   "AC5 (dead ternary) confirmed removed: board-service.mjs:992-997 diff shows the claimMtimeMs===undefined ternary gone.",
   "All 4 files changed are in-scope for this ticket."
 ],
 "failures": [],
 "pending": [{"item": "Security review (risk-check will hit; developer notes secrets handling in scripts/)", "owner": "security"}]}
```

## State
Done. QA pass. Released at in-review.

## What was checked

**Branch:** `dev/77-shared-exposure-module` at `62ace3b`  
**Specify commit (test baseline):** `f05777f`  
**Test run source:** `/tmp/77-tests.txt` (developer's saved run)  
**Test integrity:** `git diff f05777f 62ace3b -- scripts/exposure.test.mjs` → empty (no changes)

### Test results
968 pass, 0 fail, 0 skipped.

### Criterion-to-test map

**AC1 — exposure.mjs exports + shared source** ✓
- ok 615 `exposure.mjs exports DENIED_PATHS as a non-empty array`
- ok 616 `exposure.mjs exports isDenied as a function`
- ok 617 `exposure.mjs exports hasSecret as a function`
- ok 618–624 `isDenied returns true for [.env / credentials / .pem / .key / dot-directory / .scratch handoffs / _requests and *.lock / usage.jsonl]`
- ok 625 `isDenied returns false for a normal test output file in /tmp`
- ok 626 `jev.mjs imports from exposure.mjs, not risk-check.mjs`
- ok 627 `risk-check.mjs imports SECRET_PATTERNS from exposure.mjs, not defining its own`

**AC2 — hasSecret catches every listed shape** ✓
- ok 628–638 (unquoted env lines, Authorization: Bearer, JWT, sk_live_, github_pat_, gho_/ghs_/ghu_, npm_, URL creds, aws_secret_access_key, Slack xoxr-/xoxs-/xoxe-, glued GitHub prefix)
- ok 639 `hasSecret does not flag prose, prefixes alone, or short lookalikes`
- ok 640 `hasSecret: a new shape early in text >16k still blocks`

**AC3 — --tests path validation** ✓
- ok 641–650 (rejects .env, credentials, .pem, .key, dot-directory, .scratch handoffs, usage.jsonl, symlink, directory, >1 MB — each with no usage row written)

**AC4 — per-point allowlisted inputs** ✓
- ok 651 `route-bounce: decide handles the point and includes bounce comment in transport text`
- ok 652 `wake: decide handles the point and includes new comment but not handoff text`
- ok 653 `wake: user-authored comment, Scope added, and verdict events produce zero transport calls`

**AC5 — 46's dead release-gate code removed** ✓ (human-verified)
- Confirmed: `board-service.mjs` diff at lines 992–997 shows the dead `claimMtimeMs === undefined ? undefined : { cell, mode, mtimeMs: claimMtimeMs }` ternary replaced with `{ cell, mode, mtimeMs: claimMtimeMs }` directly. The guard above already throws if `claimMtimeMs === undefined`, making the ternary unreachable.

### Files changed (all in-scope)
- `scripts/exposure.mjs` — new module (AC1, AC2, AC3 in scope)
- `scripts/jev.mjs` — rewired imports; --tests validation; route-bounce and wake points (AC1, AC3, AC4)
- `scripts/risk-check.mjs` — imports and re-exports SECRET_PATTERNS from exposure.mjs (AC1)
- `apps/organism-infra/board-service.mjs` — dead ternary removed (AC5)

## Comments

**QA pass** — all 39 specify tests pass on developer's branch; test files unchanged; every AC covered.

### Flagged for security cell: wake point / author=undefined gap

**Finding:** `scripts/jev.mjs:108` — `codeWakes` returns `false` when `author` is `undefined`, so `decide({point:"wake", ...})` without an `author` field calls Jev. Ticket 67's security rule (handoffs/67-security.md:21) says "only a comment from a known cell type... may reach Jev" and names "unknown or unparseable author" as a code-wake trigger. An absent `author` (`undefined`) is neither a known cell type nor parseable.

**Ruling:** This is not a bounce. The developer made a deliberate design decision, documented in 77-developer.md: `undefined` author = internal system call (allowed); non-cell-type string = code-wake. Ticket 72 is tasked with always passing `author`. The test correctly validates the current implementation.

**Security cell action needed:** Decide whether `decide()` should be the last line of defense (treating `undefined` as code-wake, matching 67's strictest reading), or whether trusting callers (ticket 72) to always pass `author` is acceptable layered design. If the stricter rule applies, both `jev.mjs:108` (change to `author == null || !CELL_TYPES.includes(author)`) and ok 652 (pass a valid cell-type `author` in the happy-path test) need updating.

## Next step
Security review (developer's handoff notes risk-check will hit on this diff).

## Worktree receipt
Worktree: `/home/dhertzell/dsd-77-verify` — clean (no uncommitted changes; qa made no product code edits).

## Failed calls
None.
