```json
{"ticket": "organism-infra/77", "cell": "qa", "mode": "verify",
 "current_step": "Done. QA pass. 969/969 tests pass; security-required test edits strengthen, not loosen; all ACs covered.",
 "artifacts": [],
 "decisions": [
   "Test file changed since specify (f05777f): two edits, both security-required and strengthening — not a bounce.",
   "author: 'qa' added to ok 652 wake happy-path: constraint added, not loosened.",
   "New regression test for undefined/null author: coverage added, not removed.",
   "jev.mjs:108 one-liner fix confirmed: author == null || !CELL_TYPES.includes(author).",
   "Fix scope confirmed: only scripts/jev.mjs (+1/-1) and scripts/exposure.test.mjs (+20) — both in-scope."
 ],
 "failures": [],
 "pending": [
   {"item": "Security re-review of 9314bd6 one-line diff", "owner": "security"},
   {"item": "orchestrator.md 'always exits 0' wording update (needs user permission)", "owner": "orchestrator"}
 ]}
```

## State
Done. QA pass. Released at in-review.

## What was checked

**Branch:** `dev/77-shared-exposure-module` at `9314bd6`  
**Specify commit (test baseline):** `f05777f`  
**Fix base:** `62ace3b`  
**Worktree:** `/home/dhertzell/dsd-77-verify2`

### Light verify steps

#### Step 1: npm test

`npm test` in `/home/dhertzell/dsd-77-verify2`:

```
# tests 969
# suites 20
# pass 969
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

**969 pass, 0 fail, 0 skipped. ✓**

#### Step 2: Test file diff since specify commit

`git diff f05777f HEAD -- scripts/exposure.test.mjs` shows two changes:

1. `+    author: "qa"` added to the wake happy-path test (ok 652, AC4 coverage). This satisfies the corrected `codeWakes` guard that now requires a known cell type; the assertion is **strengthened**, not loosened.
2. New test block added: "wake: a comment with no author produces zero transport calls" — loops over `undefined` and `null`. This **adds** coverage; no existing assertion removed.

Both changes are security-required (handoffs/77-security.md and handoffs/77-developer-2.md). Neither removes nor loosens an assertion. **No bounce.**

#### Step 3: Criterion-to-test map

**AC1 — exposure.mjs exports + shared source** ✓
- ok 615–624: DENIED_PATHS, isDenied, hasSecret exported; isDenied returns true for all listed paths
- ok 625: isDenied returns false for normal /tmp path
- ok 626: jev.mjs imports from exposure.mjs, not risk-check.mjs
- ok 627: risk-check.mjs imports SECRET_PATTERNS from exposure.mjs

**AC2 — hasSecret catches every listed shape** ✓
- ok 628–638: unquoted env lines, Authorization: Bearer, JWT, sk_live_, github_pat_, gho_/ghs_/ghu_, npm_, URL creds, aws_secret_access_key, Slack xoxr-/xoxs-/xoxe-, glued GitHub prefix
- ok 639: hasSecret does not flag prose, prefixes alone, or short lookalikes
- ok 640: new shape early in text >16k still blocks

**AC3 — --tests path validation** ✓
- ok 641–650: rejects .env, credentials, .pem, .key, dot-directory, .scratch handoffs, usage.jsonl, symlink, directory, >1 MB — each with no usage row written

**AC4 — per-point allowlisted inputs** ✓
- ok 651: route-bounce handles point and includes bounce comment in transport text
- ok 652: wake handles point and includes new comment but not handoff text (now with `author: "qa"`)
- ok 653: user-authored comment, Scope added, and verdict events produce zero transport calls
- (new) wake: a comment with no author produces zero transport calls

**AC5 — 46's dead release-gate code removed** ✓ (human-verified, unchanged from prior verify)

#### Step 4: Files changed outside ticket scope

Fix diff `62ace3b..9314bd6` touches only:
- `scripts/jev.mjs` — in-scope (AC4, security H1 fix)
- `scripts/exposure.test.mjs` — in-scope (tests for the above)

**No out-of-scope files.**

### jev.mjs fix confirmation

```
- return author !== undefined && !CELL_TYPES.includes(author);
+ return author == null || !CELL_TYPES.includes(author);
```

Exactly the fix security required. `undefined` and `null` authors now code-wake (return `true`), preventing them from reaching Jev.

## Comments

**QA pass** — 969/969 tests pass; security-required test edits strengthen coverage; every AC covered; fix is exactly the one-liner security specified; no out-of-scope files.

## Next step

Security re-review of `9314bd6` (one-line diff in `jev.mjs`; one new test in `exposure.test.mjs`).

## Worktree receipt

Worktree: `/home/dhertzell/dsd-77-verify2` — clean (qa made no product code edits).

## Failed calls
None.
