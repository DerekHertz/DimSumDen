```json
{
  "ticket": "organism-infra/79-route-advisory-live",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA pass — 1249/1249, all criteria covered, specify tests intact.",
  "artifacts": [
    "scripts/jev-advisory.test.mjs",
    "scripts/jev-advisory-report.test.mjs"
  ],
  "decisions": [],
  "failures": [],
  "pending": [
    { "item": "security review of feat/79-route-advisory-live at d233885", "owner": "security" }
  ]
}
```

# 79 QA verify — pass

**Verdict: QA pass**

Branch: `feat/79-route-advisory-live` at `d233885`
Test run: 1249/1249 pass, 0 fail, 0 skip (from developer-supplied `/tmp/79-tests.txt`; suite not re-run in worktree — worktree was set up at the correct HEAD and cell-start succeeded).

---

## Specify-test integrity

`jev-advisory.test.mjs` (qa specify file): **no diff** between `dd3038b` and `d233885` — untouched.

`jev-advisory-report.test.mjs` (qa specify file): only **4 scope-add tests appended** at the end (the fix-round scope: shadow route report excluding advisory rows). No original assertion removed or weakened.

---

## Criterion-to-test map

| Criterion | Tests | Notes |
|---|---|---|
| [1] `route --mode advisory` returns pick+conf, logs advisory row; shadow unchanged | jev-advisory tests 738-744 (unit), 750-752 (CLI) | All ok |
| [2] Outcome row + `jev-report` advisory agreement per label | jev-advisory-report tests 722-728 | All ok |
| [3] Outage / missing key / cap → exits 0, effective orchestrator | jev-advisory tests 745-752 | All ok |
| [4] Genome edit + ADR 0015 amendment | — | **human-verified** (user applied genome script before this verify) |
| [S1] `orderRow` wiring (dispatch step logs frontier order) | jev-advisory-report tests 729-730 | All ok |
| [S2] `priority-verdict` CLI point logs jev-priority-verdict rows | jev-advisory-report tests 731-733 | All ok |
| User decision 1: shadow route report excludes advisory-mode rows | jev-advisory-report tests 734-737 (scope-add) | All ok |
| User decision 2: route-bounce advisory (show+log pick, no stop) | jev-advisory-cli tests 712, 715-716 (developer-added) | All ok |
| User decision 3: orchestrator Status-block rule | `.claude/agents/orchestrator.md` change | **human-verified** |

---

## Test quality spot-check

Tests exercise public module exports (`decide`, `buildReport`, `formatReport`, `orderRow`) and the CLI binary. They assert on real return values and log rows, not on implementation internals. Fallback coverage (no-key, http, network, cap, state-machine) uses a stubbed transport but asserts on the observable result and logged row — appropriate for unit-level. No mock-only or trivially-true assertions found.

---

## Files changed (main → d233885)

All within ticket scope:

| File | Role |
|---|---|
| `scripts/jev.mjs` | Product code — primary target |
| `scripts/jev-report.mjs` | Product code — primary target |
| `docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md` | ADR amendment — ticket required |
| `.claude/agents/orchestrator.md` | Genome edit — ticket required (user-applied) |
| `scripts/jev-advisory.test.mjs` | qa specify tests |
| `scripts/jev-advisory-report.test.mjs` | qa specify tests + scope-add append |
| `scripts/jev-advisory-cli.test.mjs` | Developer-added tests covering route-bounce advisory gap |

No files outside ticket scope.

---

## Environment issues

None.

## Failed calls

None.

---

## Next step

Security review on `feat/79-route-advisory-live` at `d233885`.

## Worktree receipt

Path: `/home/dhertzell/dsd-79-verify` — clean (detached HEAD, no uncommitted changes).
