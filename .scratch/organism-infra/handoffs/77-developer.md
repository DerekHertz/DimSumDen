```json
{"ticket": "organism-infra/77", "cell": "developer", "current_step": "Done, in-review: 62ace3b on dev/77-shared-exposure-module; qa's 39 tests pass, npm test 968/968.",
 "artifacts": ["scripts/exposure.mjs", "scripts/jev.mjs", "scripts/risk-check.mjs", "apps/organism-infra/board-service.mjs"],
 "decisions": [
   "SECRET_PATTERNS moved to exposure.mjs and extended there, so risk-check's diff scan gets the new shapes too; risk-check re-exports it for the ticket-45 test.",
   "route-bounce rows log point 'route', variant 'bounce', and share route's reservation (ADR 0015 decision 7); labels per ADR 0015 decision 3.",
   "wake: code wakes (fallback 'code-wake', no call) on a verdict, empty comment, 'Scope added' text, or an author given that is not a known cell type (user included).",
   "CLI still accepts only tier|verify|route; tickets 70 and 72 wire route-bounce and wake.",
   "A refused --tests exits 2 with no row, like other invalid arguments.",
   "isDenied tests the absolute path, so any dot-prefixed segment anywhere in it is denied."],
 "failures": [],
 "pending": [{"item": "light verify from specify SHA f05777f", "owner": "qa"}]}
```

## State
Done. Released at `in-review`.

## What changed
Branch `dev/77-shared-exposure-module`, commit `62ace3b` (base `f05777f`, qa's tests commit). qa's `scripts/exposure.test.mjs` is unchanged.
- `scripts/exposure.mjs` (new): `SECRET_PATTERNS`, `hasSecret`, `DENIED_PATHS`, `isDenied`.
- `scripts/jev.mjs`: imports `hasSecret`/`isDenied`; per-point `INPUTS` allowlist (bounce comment capped 2,000 chars after the ticket; wake is the title and Status lines plus the comment, each capped 4,000); new `route-bounce` and `wake` points; `readTests` confinement (lstat not a symlink, path and realpath not denied, `O_NOFOLLOW` open, regular file, at most 1 MiB).
- `scripts/risk-check.mjs`: imports and re-exports `SECRET_PATTERNS`.
- `board-service.mjs`: ticket 46's dead `claimMtimeMs === undefined ? ...` ternary removed (AC5).

## Checks run
- ReDoS probe with 200k-char adversarial inputs: every pattern runs under 20 ms. The first URL-credential regex was quadratic (about 1 s) and is fixed.
- A false-positive scan of every tracked file: no new pattern hits anything except the positive fixtures that were already there (`risk-check.test.mjs`, ticket 08, handoff 38-security).

## For the orchestrator (outside scope, not done)
- **jg wrapper**: the ticket says it imports `exposure.mjs`, but no wrapper exists yet (ADR 0014 follow-up A). Whoever builds it should import from here.
- **Operational**: `orchestrator.md` says `jev.mjs` "always exits 0", but a denied `--tests` path now exits 2. That includes a scratchpad inside any dot-directory, such as `.claude/worktrees/...` or `~/.cache/...`. Test output should be saved under a non-hidden path (e.g. `/tmp/...`). The genome wording needs the user's permission to change.
- **Test vs. ticket 67**: in the qa wake test "includes new comment", `author` is omitted and the test expects a Jev call. 67 says an unknown author wakes via code. So an omitted author is allowed and an unknown one is not. Ticket 72 must always pass `author`.
- risk-check will hit on this diff (secrets handling and shelling out in `scripts/`), so security runs.

## Next step
qa light verify from `f05777f`.

## Suggested skills
`organism-protocol`.

## Gotchas
Build any token-shaped fixture at runtime (CI gitleaks). `sk_live_`/`rk_` are separate from `sk-`.
