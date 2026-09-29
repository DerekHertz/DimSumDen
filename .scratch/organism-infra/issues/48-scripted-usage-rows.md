# 48: Scripted usage rows: resolved row on release, log-cell script

**Type:** feature

**What to build:** In session 8 the orchestrator skipped every `cell` and `resolved` row in `.scratch/usage.jsonl`, and jev-report then saw no data. Move these rows out of genome prose and into code:
- `board release --status resolved` appends `{"kind":"resolved","ts","ticket","pr","bounces"}` itself. It takes `--pr <n>`, required for code tickets, and counts bounces from the ticket's board events or comments. Document where the count comes from.
- A new `scripts/log-cell.mjs --ticket <ref> --cell <type> [--mode <m>] --tokens <n> --ms <n> --outcome <text>` appends one validated `cell` row. It rejects an unknown ticket and non-numeric tokens.
- Update ADR 0008 (and ADR 0010 if it names who writes these rows).

The orchestrator genome is then changed on main to call these instead of hand-writing JSON. That edit is a follow-up once this merges.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] `board release --status resolved --pr N` appends exactly one well-formed resolved row, with a bounce count (test)
- [ ] `log-cell.mjs` appends a valid row and rejects bad input without writing (tests)
- [ ] ADR updated

## Comments

- **Created (orchestrator, 2026-09-28):** From session 8's logging incident, published with the user's yes.
- **qa, 2026-09-29:** QA specify: tests in scripts/usage-rows.test.mjs (2db9963); contract pinned in header; see handoffs/48-qa-specify.md. ADR criterion covered by a text-match test.
- **qa, 2026-09-29:** QA specify revised: bounces from comment --verdict; tests at bf29f8f.
- **developer, 2026-09-29:** Test 'non-code ticket (Type: design) may resolve without --pr' claims as architect then resolves; ADR 0008 decision 9 (organism-infra/24) forbids non-orchestrator resolve, so it fails 1/26. Fix: claim it as orchestrator with Type: design. Not edited.
- **qa, 2026-09-29:** QA pass at 52d7b6b: 341 of 341 tests; test diff since bf29f8f is only the orchestrator claim. See 48-qa-verify.md
- **security, 2026-09-29:** Security pass at 52d7b6b. medium: --verdict is not role-gated, any cell or --as can post a bounce (advisory telemetry). low: resolved-row append failure after commit leaves ticket resolved with no row; --pr ignored on non-resolved releases; usage.jsonl appends skip symlink containment. No injection into events.jsonl or usage.jsonl; gitleaks clean. See handoffs/48-security.md.
- **orchestrator, 2026-09-29:** PR #37 merged
