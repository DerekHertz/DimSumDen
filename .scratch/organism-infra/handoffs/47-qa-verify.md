```json
{"ticket": "organism-infra/47", "cell": "qa", "mode": "verify",
 "current_step": "Full verify complete — QA pass on both 47 and 68/2",
 "artifacts": ["scripts/jev-hardening.test.mjs", "scripts/jev-report-exit-criteria.test.mjs"],
 "decisions": [
   "Full verify ran (not light: no prior qa cell on this batch per jev check).",
   "jg.test.mjs and jg-wrapper.test.mjs setup changes (bare temp roots → roots with .git dir) are acceptable: only setup changed, assertions unchanged, and the boundary condition is covered by jev-hardening test 14.",
   "Low-80-2 (bash-guard shell indirection) remains human-verified per specify decision; ticket 52 owns it."
 ],
 "failures": [],
 "pending": [{"item": "security review of feat/batch-B, then orchestrator opens PR and merges on green CI", "owner": "security"}]}
```

**State:** done — QA pass on organism-infra/47 and organism-infra/68 criterion 2, branch feat/batch-B @ edddb8f.

## Verify results

### 1. Test suite — 1274/1274 pass, 0 fail, 0 skipped (exit 0)

Scout ran `npm test` in `/home/dhertzell/dsd-B-verify`. Full suite in ~19 s.

### 2. QA test file integrity — no changes

`git diff 77ea34b edddb8f -- scripts/jev-hardening.test.mjs scripts/jev-report-exit-criteria.test.mjs` produced empty output. No assertions removed or loosened.

### 3. Criterion → test map

| Ticket | Criterion | Test file | Tests | Status |
|--------|-----------|-----------|-------|--------|
| 47/1 | null line, constructor NaN, \| key, control char handled without throw/NaN/raw output | jev-hardening.test.mjs | 1–7 | ✅ passing |
| 47/2 | unknown --ticket exits non-zero, no row appended, stderr message | jev-hardening.test.mjs | 8–10 | ✅ passing |
| Low 70 | empty bounceComment skips transport | jev-hardening.test.mjs | 11 | ✅ passing |
| Low 72 | newInputs drops `..` in feature or ticket | jev-hardening.test.mjs | 12–13 | ✅ passing |
| Low 80 | runJg refused without .git ancestor | jev-hardening.test.mjs | 14 | ✅ passing |
| Low 80-2 | bash-guard shell indirection | — | human-verified (ticket 52) | human-verified |
| 68/2 | buildReport checks shape (coverage, value, spend), safetyBounces; formatReport PASS/FAIL per criterion, bounced ticket listing | jev-report-exit-criteria.test.mjs | 1–11 | ✅ passing |

### 4. Files outside qa's two test files touched by the diff

- `scripts/jev-report.mjs` — in scope (47/1, 68/2)
- `scripts/jev.mjs` — in scope (47/2, Low 70)
- `scripts/jev-wake-prelude.mjs` — in scope (Low 72)
- `scripts/jg.mjs` — in scope (Low 80)
- `scripts/jg.test.mjs` — **test setup change** (bare temp root → root with `.git`); assertions unchanged
- `scripts/jg-wrapper.test.mjs` — **test setup change** (bare temp root → root with `.git`); assertions unchanged

Security and orchestrator decide on the test file changes.

### 5. Developer decision: Low-80 root rule breaking 9 success-path tests

**Acceptable.** The new `checkRoot()` rule in `jg.mjs` correctly refuses a root with no `.git` ancestor and no explicit `checkout`. The 9 broken tests were using bare `mkdtempSync` temp dirs that no longer satisfy the precondition. The developer updated only the `makeRoot()`/`repo()` setup helpers to create a `.git` subdirectory; every assertion is identical to before. The boundary contract (root without `.git` → `Refused`) is covered independently by jev-hardening test 14, so no coverage is lost. This is a setup update, not a weakening.

## Comments

QA pass. All 25 specify tests pass without modification. All acceptance criteria (including Batch B scope additions) are covered by passing tests or marked human-verified. Files outside qa's two test files: jev-report.mjs, jev.mjs, jev-wake-prelude.mjs, jg.mjs (all in scope), plus jg.test.mjs and jg-wrapper.test.mjs (setup-only changes, assertions intact).
