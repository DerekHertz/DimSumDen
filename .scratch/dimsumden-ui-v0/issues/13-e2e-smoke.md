# 13: End-to-end smoke: bridge + UI on a fixture board

**Type:** feature

**Priority:** P1

**What to build:** One command (e.g. `npm run smoke:ui`) that starts the bridge on a fixture `.scratch/` tree, loads the UI with `apps/ci-cd/smoke.mjs`, and checks the scene count, queue order, a chart, and one Approve round trip. Wire it into CI if cheap.

**Blocked by:** 08, 10, 11

**Status:** resolved

- [ ] The smoke command exits non-zero on any failure and passes on main

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** qa specify done: 4 red tests in apps/ci-cd/smoke-ui.test.mjs @ d2e421e; see handoffs/13-qa-specify.md
- **qa, 2026-09-29:** QA pass: 655/655 tests, specify tests unchanged, criterion covered (see handoff 13-qa-verify.md)
- **security, 2026-09-29:** Security pass. No critical/high. Low: smoke-ui.mjs:82-86 fixture setup outside try can leak a tmp dir; smoke.mjs --url has no scheme restriction (local invoker only). gitleaks clean. Handoff: handoffs/13-security.md
