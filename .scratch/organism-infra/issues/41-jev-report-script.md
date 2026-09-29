# 41: scripts/jev-report.mjs shadow report

**Type:** feature

**What to build:** Join jev rows with cell and resolved rows in usage.jsonl, project counterfactual tokens and print the exit-criteria table from ADR 0010. Design: docs/adr/0010-jev-precheck-tier-and-verify-depth.md.

**Blocked by:** 38

**Status:** resolved

- [ ] Report prints the exit-criteria table from fixture rows (test)
- [ ] Counterfactual token projection per ticket (test)

## Comments

- **Created (orchestrator, 2026-09-28):** Follow-up of 04 (ADR 0010), published with the user's yes.
- **qa, 2026-09-29:** QA bounce: scripts/jev-report.mjs:25-79 counts unresolved tickets (live: 41, no resolved row) in value numbers; ADR 0010 says per resolved ticket. Missing test for exclusion. See handoffs/41-qa-verify.md. Zero-token 34 cannot skew percent.
- **qa, 2026-09-29:** QA pass (fix round, 0f27002): 315/315, tests unchanged since 3a9c393, diff only scripts/jev-report.mjs, live value counts resolved tickets only. See handoffs/41-qa-verify2.md.
- **security, 2026-09-29:** Security pass. No critical/high/medium. Low: jev-report.mjs:32 null JSON line crashes; :56-57 pick 'constructor' gives NaN (use Object.hasOwn); :12 ticket key regex allows control chars in output. gitleaks clean. See handoffs/41-security.md.
- **orchestrator, 2026-09-29:** PR #36 merged
