```json
{"ticket": "organism-infra/72", "cell": "qa", "mode": "verify", "current_step": "QA pass on feat/72-wake-gate-prelude at 314bd8a; all 1160 tests pass; ready for security.",
 "artifacts": ["scripts/jev-wake-prelude.test.mjs", "scripts/jev-wake-report.test.mjs"],
 "decisions": [
   "Replaced '80%+ wakes' test is valid: matches both user verdicts in ticket Comments.",
   "In-flight cells (inFlightCount > 0) waking at any usage level fits the user verdict wind-down list.",
   "Second user verdict (ambiguous Jev labels still wake at 80%+) is covered by existing needs-claude/other/Jev-failure tests; no additional test needed.",
   "AC6 remains human-verified via exposure.test.mjs as specify noted."
 ],
 "failures": [],
 "pending": [{"item": "security review (risk-check hits from round 1: gh shell-out, board code, fake sk- key in test)", "owner": "security"}]}
```

**cell:** qa | **mode:** verify | **branch:** feat/72-wake-gate-prelude | **commit verified:** 314bd8a
**ticket:** organism-infra/72-jev-wake-gate-prelude-shadow

## State

Done. QA pass.

## What changed

Branch feat/72-wake-gate-prelude at 314bd8a (includes user genome commit 8b3c807). Full test suite: **1160/1160 pass, 0 fail, 0 skipped**.

## Replaced test matches user verdict

The ticket carries two user-verdict Comments:

1. **Orchestrator comment (scope added, 2026-09-30):** "at 5-hour usage >= 80% the wake prelude never wakes on its own and suppresses frontier wakes. It still wakes for wind-down items: in-flight cells, red CI or merge conflict, user-authored comments, pending gate requests."

2. **Orchestrator comment (user verdict, 2026-09-30):** "at usage >= 80%, ambiguous cell comments labelled needs-claude or other by Jev (or a failed Jev call) still wake. Kept as built in 314bd8a."

The developer replaced `codeDecides: usage at 80% wakes; 79% does not` (original qa pin) with six new tests:
- `usage alone never wakes, at any level` – covers "never wakes on its own"
- `usage at 80%+ suppresses a frontier wake; 79.9% does not` – covers frontier suppression
- `wind-down items still wake at 80%+ usage` (inFlight, ciRed, conflicted, openVerdictRequest, ciUnknown) – covers all named wind-down items
- `a cell in flight wakes; none does not` – covers in-flight cells explicitly
- `at 80%+ usage a frontier alone does not wake, and says why` (runPrelude)
- `at 80%+ usage, user-authored, Scope added and verdict comments still wake without Jev` (runPrelude)

The second user verdict ("ambiguous Jev labels still wake at 80%+") is covered by the existing AC3 tests for `needs-claude`, `other`, and Jev failure—those tests have no usage constraint and remain untouched. The replacement is faithful to both verdicts.

## In-flight cells behaviour fits the ticket

`inFlightCount > 0` is listed explicitly in the user verdict's wind-down list. The developer wired it into `codeDecides` and added two CLI tests. No scope creep; it's part of the accepted verdict.

## Criterion-to-test map

| AC | Tests |
|----|-------|
| AC1 | `codeDecides: frontier non-empty`, `frontierCount 0`, `usage alone never wakes`, `80%+ suppresses frontier`, `wind-down items still wake`, `a cell in flight wakes`, `CI red wakes`, `merge conflict wakes`, `open user-verdict gate request wakes`, `no condition → wake:false`, `runPrelude: code condition wakes, Jev not called` |
| AC2 | `runPrelude: user-authored comment`, `Scope added comment`, `verdict comment`, `unknown author`; also `at 80%+ usage, user-authored…still wake without Jev` |
| AC3 | `cell-authored non-verdict comment calls Jev`, `needs-claude wakes`, `informational does not wake`, `other wakes`, `Jev failure wakes`, `one needs-claude among informational → overall wake`, `no inputs → wake:false` |
| AC4 | `logs a jev row for each Jev call`, `code-wake inputs produce no jev rows`, `resolves to plain object (no timer)`, `CLI: exits within timeout with no args` |
| AC5 | All tests in `scripts/jev-wake-report.test.mjs` (unchanged from specify) |
| AC6 | human-verified (exposure.test.mjs covers the wake point, as noted in 72-qa-specify-2.md) |

## Out-of-scope files touched (list, not judgment)

| File | Change |
|------|--------|
| `scripts/jev.mjs` | One-line export of `codeWakes`; needed by the new prelude |
| `scripts/jev-wake-prelude-cli.test.mjs` | New file: CLI glue tests added by developer beyond spec minimum |
| `.claude/agents/orchestrator.md` | User commit 8b3c807; genome edit proposed in 72-developer.md |

Security and orchestrator decide on these.

## Next step

Security review on feat/72-wake-gate-prelude. Risk-check hits: `gh` shell-out, board code, fake `sk-` key in `jev-wake-prelude.test.mjs`. See 72-developer.md for details.

## Suggested skills

organism-protocol, security (genome).

## Gotchas

- Don't run the CLI against the real board; it can call Jev and write real rows to `usage.jsonl`.
- `node --test --test-reporter=dot` prints no totals; use default TAP and grep `^# (tests|pass|fail|skip)`.

## Worktree receipt

Worktree: `/home/dhertzell/dsd-72-verify`  
Status: **clean** (detached HEAD at 314bd8a, nothing to commit)

## Failed calls

None.
