```json
{"ticket": "organism-infra/47", "cell": "qa", "mode": "specify",
 "current_step": "Failing tests committed on tests/batch-B @ 77ea34b",
 "artifacts": ["scripts/jev-hardening.test.mjs", "scripts/jev-report-exit-criteria.test.mjs"],
 "decisions": [
   "Low-72 guard tested at the newInputs() seam (filter out events with '..' before ticketTextOf is called), not inside ticketTextOf itself, so the fix is forced into the exported function.",
   "Low-80 test uses a mkdtempSync root in /tmp — guaranteed no .git ancestor on Linux; the test injects a fake run() so jg need not be installed.",
   "Low-70 test passes empty string bounceComment to decide() via the exported seam; no CLI spawn needed.",
   "68/2: buildReport must expose checks.{coverage,value,spend} booleans and safetyBounces per point; formatReport must print PASS/FAIL per criterion and list bounced tickets with their picks. Value bar is savedPct >= 30 per ADR 0010 decision 10.",
   "80-Low-2 (bash-guard shell indirection) is a documented residual (ticket 52) — no test written; marked human-verified in Comments."
 ],
 "failures": [],
 "pending": [{"item": "implement jev-report.mjs and jev.mjs and jev-wake-prelude.mjs and jg.mjs fixes so all 25 tests pass", "owner": "developer"}]}
```

**State:** done — 25 failing tests committed on `tests/batch-B` @ `77ea34b`; all fail for the right reason (missing feature), none for syntax or setup errors.

**What changed:** branch `tests/batch-B` (worktree `/home/dhertzell/dsd-B-qa`), commit `77ea34b`.

- `scripts/jev-hardening.test.mjs` — 14 tests mapping to ticket 47 and security Lows 70/72/80.
- `scripts/jev-report-exit-criteria.test.mjs` — 11 tests mapping to ticket 68 criterion 2.

**Criterion → test map**

| Ticket | Criterion | Test(s) in file | Notes |
|--------|-----------|-----------------|-------|
| 47/1 | null line handled | `jev-hardening.test.mjs`: tests 1–2 | `buildReport` currently throws on null.ticket |
| 47/1 | constructor pick → NaN | tests 3–4 | TIER_WEIGHT["constructor"] inherits Object ctor; same for VERIFY_WEIGHT["toString"] |
| 47/1 | ticket key with `\|` | tests 5, 7 | keyOf currently accepts `[^/]+`; key appears in output |
| 47/1 | ticket key with control char | test 6 | same keyOf issue |
| 47/2 | unknown ticket exits non-zero | test 8 | currently exits 0 (falls to no-key fallback) |
| 47/2 | unknown ticket appends no row | test 9 | currently appends fallback row |
| 47/2 | unknown ticket stderr message | test 10 | currently prints nothing to stderr |
| Low 70 | empty bounceComment skips transport | test 11 | decide() currently calls transport 1× |
| Low 72 | newInputs drops `..` in feature | test 12 | no filter today |
| Low 72 | newInputs drops `..` in ticket | test 13 | no filter today |
| Low 80 | runJg refused without .git ancestor | test 14 | checkRoot skips boundary when top=null |
| Low 80-2 | bash-guard shell indirection | — | **human-verified** — documented residual (ticket 52) |
| 68/2 | buildReport checks shape (tier) | `jev-report-exit-criteria.test.mjs`: test 1 | checks obj missing |
| 68/2 | buildReport checks shape (verify) | test 2 | checks obj missing |
| 68/2 | checks.value false < 30% | test 3 | undefined today |
| 68/2 | checks.value true ≥ 30% | test 4 | undefined today |
| 68/2 | checks.coverage false < 5 tickets | test 5 | undefined today |
| 68/2 | checks.spend false when cap fires | test 6 | undefined today |
| 68/2 | safetyBounces shape + content | test 7 | missing from buildReport |
| 68/2 | safetyBounces excludes zero bounces | test 8 | missing |
| 68/2 | safetyBounces excludes fallback rows | test 9 | missing |
| 68/2 | formatReport PASS/FAIL per criterion | test 10 | no PASS/FAIL in current output |
| 68/2 | formatReport safety bounce listing | test 11 | no pick+bounce lines in output |

**Decisions made**

- `checks.value` bar: `savedPct >= 30` (ADR 0010 decision 10: "at least 30% fewer tokens").
- `checks.coverage` bar: `tickets >= 5 && fallbacks * 5 <= tickets && medianMs < 2000` (ADR 0010).
- `checks.spend` bar: `capFired === 0`.
- `safetyBounces` definition: resolved tickets with `bounces > 0` AND a non-fallback, non-null jev pick for that point. Used by the orchestrator to know exactly which tickets' handoffs to check.

**Next step:** Developer implements the fixes on a branch from `tests/batch-B`, making all 25 tests pass.

**Suggested skills:** `implement`, `organism-protocol`

**Gotchas:**
- The `|` in ticket keys also corrupts the internal `id.split("|")` used to separate ticket from point in `buildReport`. The fix to `keyOf` (restrict to `[\w.-]+`) will address this atomically.
- `TIER_WEIGHT`/`VERIFY_WEIGHT` lookups need `Object.hasOwn` not `!== undefined` (inherited properties are truthy).
- Low-72 fix location: the `newInputs()` function, not the `ticketTextOf` callback (tests are seamed there).
- Low-80: when `checkoutOf` returns `null`, the code must refuse the root (not allow it). The `checkout` param to `runJg` is optional only when the root has a `.git` ancestor.
