# Handoff: organism-infra/08 risk-sized review -- security round 2

**Ticket:** `.scratch/organism-infra/issues/08-risk-sized-review.md`
**Branch:** `claude/organism-infra-08-risk-sized-review`, commit `d094a0f`
**Verdict: Security pass**

## What I did

Reviewed `git diff cf559a7..d094a0f` via detached checkout of `d094a0f` in my own worktree, against my round-1 findings in `.scratch/organism-infra/handoffs/08-security.md`. Ran `npm install` (node_modules was missing) then `npm test`: 62/62 pass.

## Findings confirmed fixed

- **HIGH (option injection):** re-ran the exact exploit, `node scripts/risk-check.mjs "--output=pwned.txt"` -- no file written, script now exits 1 with a clear refusal (`refusing option-shaped range argument`) instead of falsely printing `clean`. Also tried a mid-string option (`main...HEAD --output=...`) and a leading-space range -- the added `--end-of-options` stops both; they crash on an "ambiguous argument" git error but still exit 1 (fails closed, no bypass, no write).
- **MEDIUM (shelling-out regex):** `scripts/risk-check.mjs:33` now matches `execFileSync`; confirmed by grep and by the new dedicated regression test at `scripts/risk-check.test.mjs:192` (execFileSync call added against an already-present, untouched import line).
- **LOW (PEM fixture):** `scripts/risk-check.test.mjs:80` now builds the PEM header/footer via runtime string concatenation. Grepped the full diff and current source -- no literal PEM private-key header/footer string remains anywhere in source.

No new dependency, no `.github/` changes, no secrets beyond the intended test fixtures.

## Next

Verdict appended to the ticket's `## Comments`. I did not touch branch, ticket status, or lock -- orchestrator holds it.

## Environment issues

None. `npm install` succeeded cleanly (0 vulnerabilities); full `npm test` passed 62/62 this round (developer's round-1 note about a missing `playwright` module in a stale worktree did not reproduce here).
