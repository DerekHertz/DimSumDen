# 79: Route advisory-live: show Jev's pick at the dispatch gate

**Type:** feature

**Priority:** P1

**What to build:** Move the `route` point (69 new-ticket, 70 bounce) from shadow to advisory-live. When the orchestrator proposes a dispatch, it runs `jev.mjs route` (or `route-bounce`) and shows Jev's pick and confidence next to its own. The user still approves every dispatch, and Jev never picks the cell on its own. Log each outcome as a row that `jev-report.mjs` reads: the orchestrator's pick, Jev's pick, the user's final choice, and whether the dispatched cell later bounced. Advisory mode is exempt from the ADR 0015 go-live bars. Those bars still gate the step where Jev's pick is applied without asking; the advisory rows are the data for revisiting them. Record this as an ADR 0015 amendment (architect, user's yes).

Genome change (`.claude/agents/orchestrator.md`): the dispatch step shows the route pick. Cells can't edit `.claude/`, so the developer writes the exact edit into its handoff and the user applies it.

**Blocked by:** 70

**Status:** resolved

- [ ] `jev.mjs route --mode advisory` returns the pick and confidence and logs an `advisory` row; the shadow rules for other points are unchanged (tests)
- [ ] An outcome row records orchestrator pick, Jev pick, user choice, and later bounce; `jev-report.mjs` prints advisory agreement per label (tests)
- [ ] A Jev outage, missing key or cap still exits 0 and the dispatch proceeds without a pick (test)
- [ ] Genome edit and ADR 0015 amendment written for the user to apply

## Comments

- **Created (orchestrator, 2026-09-30):** User chose advisory-live route testing so real runs can inform the go-live thresholds.
- **orchestrator, 2026-09-30:** Scope added (orchestrator, from 71): wire orderRow so the dispatch step logs actual vs Jev frontier order, and record the user's verdict on each priority flag as a jev-priority-verdict row. Both were deferred from 71 by qa verify.
- **orchestrator, 2026-09-30:** User wants a herald post about the Jev pipeline experience once advisory data exists (79 rows plus batch A shadow verify picks vs full-verify findings). Dispatch herald after 79 has run on a few dispatches.
- **qa, 2026-09-30:** qa specify: tests on tests/79-route-advisory-live (dd3038b); 16 failing tests, 1219 passing. Handoff: 79-qa-specify.md
- **qa, 2026-09-30:** qa specify done; tests on tests/79-route-advisory-live ready for developer
- **developer, 2026-09-30:** developer: implemented at f3d8a69 on feat/79-route-advisory-live, 1245/1245 tests. Genome edit: user runs node /tmp/79-claude-edits.mjs before qa verify. Open questions (anchored shadow join, post-bounce approval) in 79-developer.md
- **orchestrator, 2026-09-30:** User decisions: (1) shadow route report excludes advisory-mode rows; they show only in the advisory section (scope add, fix round before qa verify). (2) bounces keep auto re-dispatch; show and log Jev's route-bounce pick without stopping. (3) orchestrator Status-block rule ships in this PR.
- **developer, 2026-09-30:** developer fix1: shadow route report excludes advisory rows at 4be608a, 1249/1249 tests. Handoff: 79-developer-fix1.md
- **security, 2026-09-30:** Security pass. 3 risk-check hits, all Low. (1) scripts/jev-advisory.test.mjs:29 and scripts/jev-advisory-cli.test.mjs:15 — sk-test placeholder strings, clearly fake (matches ticket 72 pattern, gitleaks clean). (2) spawnSync in three test files — controlled invocation of process.execPath + hardcoded script, no shell:true, no injection vector. (3) frontierTickets board reads — validRef regex + !includes("..") guard prevents path traversal; filenames come from readdirSync, not user input. No new dependencies (npm audit 0 vulns). No CI/CD changes. No secrets committed (gitleaks: no leaks, 6 commits scanned). Handoff: 79-security.md.
- **qa, 2026-09-30:** QA pass (full verify). 1249/1249 tests, 0 fail, 0 skip. Specify tests (jev-advisory.test.mjs: unchanged; jev-advisory-report.test.mjs: only 4 scope-add tests appended, none removed or weakened). Criterion map: [1] advisory pick+conf → tests 738-744 (jev-advisory), 750-752 (CLI); [2] outcome row + advisory report → tests 722-728 (jev-advisory-report); [3] outage/no-key/cap exits 0 → tests 745-752; [4] genome edit + ADR 0015 → human-verified; [S1] orderRow → tests 729-730; [S2] priority-verdict → tests 731-733; user-decision-1 (shadow excludes advisory rows) → tests 734-737; user-decision-2 (route-bounce advisory) → developer tests 712, 715-716; user-decision-3 (Status-block rule) → genome change, human-verified. Out-of-scope files: none (all 7 changed files are within the ticket's stated scope: jev.mjs, jev-report.mjs, ADR, orchestrator genome, and three test files). Handoff: 79-qa-verify.md.
