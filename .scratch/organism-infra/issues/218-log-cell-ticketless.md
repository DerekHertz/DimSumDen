# 218: `log-cell` logs ticketless runs

**Type:** bug

**Priority:** P3

**Class:** pipeline

**Blocked by:** None

**Status:** resolved

**Serves:** Spend accuracy. `log-cell` (and `jev route`/`tier`) require a real ticket ref, so subagent runs not tied to a ticket (README capture scouts, survey scouts) can't be logged. This happened twice (2026-10-01, 2026-10-08); the second time left two Haiku scout runs, about 58k tokens, out of the trial measures.

## What to build

`node scripts/log-cell.mjs --ticket none ...` writes the cell row with `"ticket": null`, keeping every other field and check (model, tokens, ms, `--transcript` totals). A ticketless row is not counted toward any ticket's totals, but it shows up in `npm run spend` under its role.

## Acceptance criteria

- [ ] `--ticket none` writes one row with `ticket: null`, with the same token/model fields a ticketed row has (test).
- [ ] An unknown ref other than `none` is still refused (test).
- [ ] `npm run spend` includes ticketless rows in the per-role totals and leaves them out of per-ticket totals (test).
- [ ] `npm test` is green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the retro on the user's yes (2 repeats).
- **orchestrator, 2026-10-08:** Env: an empty `/tmp/.git` (made 22:49:04 PDT while Codex's linux sandbox ran in this repo) turns Low-80 in `jev-hardening.test.mjs` red. User: leave it, since Codex may own it. qa verify treats Low-80 as a known environment failure (197); every other test must be green.
- **orchestrator, 2026-10-08:** User decision on qa's escalation: a ticketless (`--ticket none`) row from a cell other than scout must pass `--allow-no-handoff "<reason>"`, or log-cell refuses it (this keeps the organism-infra/51 guard). Scout stays exempt. Pin it with a test. One developer fix round, then light verify again.
- **orchestrator, 2026-10-08:** Suite on 0c613d7 (`/tmp/218-tests-2.txt`): 3184/3186. Low-80 is the known environment failure (197). `runSpikes S4b` (`apps/bridge/cells/conformance.test.mjs`) failed in the full run and passed 114/114 when that file ran alone, so it is load flake. The proximity-card browser test the developer saw fail passed in this run.
- **qa, 2026-10-09:** QA pass (light verify, 0c613d7): specify tests unchanged, only test 9 added; suite green except known Low-80 (197); AC1-AC4 mapped. Handoff 218-qa-verify-3.
- **orchestrator, 2026-10-09:** qa light verify passed at 0c613d7 (round 3). risk-check exited 1 with 2 hits, both in `scripts/log-cell-ticketless.test.mjs` (shells out to another program; board code), so full `security` is next: `--base 0c613d7 --detach --continue`. Then PR and merge on green. The branch is pushed to origin.
- **security, 2026-10-11:** Security pass (0c613d7): no critical/high. Only log-cell.mjs and its test changed; 'none' is an exact string and builds no path; non-scout ticketless rows need --allow-no-handoff; gitleaks clean; no dependency change. Handoff 218-security.
- **orchestrator, 2026-10-11:** Security pass at 0c613d7, but the branch conflicts with main in scripts/log-cell.mjs (c6572eb). No PR opened. Next: developer round to merge main and resolve, then light qa verify and risk-check on the new SHA (user, 2026-10-11: after agent-os/02 qa specify returns).
- **qa, 2026-10-11:** QA pass (light verify, fa6f193, round 4): suite 3518/3518 from saved dev run; specify tests unchanged (one addition); AC1-AC4 and allow-no-handoff scope mapped. Handoff 218-qa-verify-4.
- **security, 2026-10-11:** Security pass at fa6f193. No findings at medium or above; gitleaks clean (3 commits); no dependency or workflow change. See handoffs/218-security-2.md.
